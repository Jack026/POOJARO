/**
 * File-backed persistence for the local datastore.
 *
 * The whole dataset lives in one JSON document under `.data/`. That is a
 * deliberate trade: it makes the demo layer zero-setup and makes every mutation
 * trivially atomic, at the cost of not scaling past a single Node process. For
 * production, set DATA_BACKEND=firestore.
 *
 * Two guarantees this file provides:
 *
 *  1. Serialised writes. `mutate()` runs callbacks one at a time through a
 *     promise chain, so two concurrent checkouts cannot interleave their
 *     read-modify-write and both claim the last unit.
 *  2. Crash-safe writes. Data is written to a temp file and renamed over the
 *     target, so a process killed mid-write leaves the previous good file.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { serverEnv } from '../../env';
import { buildSeedDatabase, SCHEMA_VERSION } from '../seed';
import type { Database } from '../types';

const FILE_NAME = 'poojaro.json';

interface LocalState {
  db: Database;
  path: string;
}

/**
 * Held on globalThis so Next's dev-server module reloading cannot produce two
 * independent caches — which would silently break the write serialisation.
 */
interface LocalGlobal {
  state: LocalState | null;
  loading: Promise<LocalState> | null;
  queue: Promise<unknown>;
}

const GLOBAL_KEY = '__poojaro_local_store__';

function globals(): LocalGlobal {
  const holder = globalThis as typeof globalThis & { [GLOBAL_KEY]?: LocalGlobal };
  holder[GLOBAL_KEY] ??= { state: null, loading: null, queue: Promise.resolve() };
  return holder[GLOBAL_KEY];
}

function dataFilePath(): string {
  const dir = serverEnv().localDataDir;
  return join(isAbsolute(dir) ? dir : resolve(process.cwd(), dir), FILE_NAME);
}

async function loadState(): Promise<LocalState> {
  const path = dataFilePath();
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Database;
    if (parsed.meta?.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `Local datastore at ${path} was written by schema v${parsed.meta?.schemaVersion ?? '?'}, this build expects v${SCHEMA_VERSION}. Delete the file (or run \`npm run seed:reset\`) to reseed.`,
      );
    }
    return { db: parsed, path };
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException)?.code === 'ENOENT';
    if (!isMissing) throw error;
    const db = await buildSeedDatabase();
    await persist(path, db);
    return { db, path };
  }
}

async function persist(path: string, db: Database): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
  await rename(temp, path);
}

async function state(): Promise<LocalState> {
  const g = globals();
  if (g.state) return g.state;
  // Collapse concurrent first-loads into one, so the seed is written once.
  g.loading ??= loadState().then((loaded) => {
    g.state = loaded;
    g.loading = null;
    return loaded;
  });
  return g.loading;
}

/** A read-only view. Callers must not mutate what they receive. */
export async function snapshot(): Promise<Database> {
  return (await state()).db;
}

/**
 * Run `fn` against the live database with exclusive access, then persist.
 *
 * `fn` may mutate `db` freely. If it throws, the in-memory object may have been
 * partially modified, so the state is discarded and reloaded from the last good
 * file — a failed mutation never leaves a half-applied change behind.
 */
export async function mutate<T>(fn: (db: Database) => Promise<T> | T): Promise<T> {
  const g = globals();
  const run = async (): Promise<T> => {
    const current = await state();
    const before = JSON.stringify(current.db);
    try {
      const result = await fn(current.db);
      current.db.meta.revision += 1;
      await persist(current.path, current.db);
      return result;
    } catch (error) {
      current.db = JSON.parse(before) as Database;
      throw error;
    }
  };

  // Chain onto the queue so mutations serialise. `catch` keeps one failure from
  // poisoning every write that follows it.
  const next = g.queue.then(run, run);
  g.queue = next.catch(() => undefined);
  return next;
}

/** Test and CLI helper: drop the cache so the next call reloads from disk. */
export function resetLocalCache(): void {
  const g = globals();
  g.state = null;
  g.loading = null;
}

export { dataFilePath };
