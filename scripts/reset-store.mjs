#!/usr/bin/env node
/**
 * Deletes the local datastore file so the next server start reseeds it.
 *
 * Run with: npm run seed:reset
 *
 * Only touches the local demo backend. It refuses to run when DATA_BACKEND is
 * firestore, because a real project's data is not something a dev script should
 * be able to wipe.
 */
import { rm, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';

const backend = (process.env.DATA_BACKEND ?? 'local').trim().toLowerCase();
if (backend !== 'local') {
  console.error(
    `DATA_BACKEND is "${backend}". This script only resets the local demo store.\n` +
      'To reseed a Firestore project, delete its collections from the Firebase console.',
  );
  process.exit(1);
}

const dir = process.env.LOCAL_DATA_DIR ?? '.data';
const file = join(isAbsolute(dir) ? dir : resolve(process.cwd(), dir), 'poojaro.json');

try {
  await stat(file);
} catch {
  console.log(`Nothing to reset — ${file} does not exist. The next start will seed it.`);
  process.exit(0);
}

await rm(file, { force: true });
console.log(`Removed ${file}.`);
console.log('Start the dev server and the seed catalogue will be rebuilt from src/lib/data/seed.');
