/**
 * The one place application code asks for data.
 *
 * Nothing outside `src/lib/data` should import an adapter directly. Route
 * handlers, server components and server actions call `getStore()` and talk to
 * the `DataStore` interface, which is what lets the same code run against the
 * zero-setup local demo backend and against Firestore.
 *
 * This module is server-only: `serverEnv()` throws if it is reached from the
 * browser, so an accidental client import fails loudly instead of leaking
 * credentials into a bundle.
 */
import { serverEnv } from '../env';
import type { DataStore } from './store';

interface StoreGlobal {
  store: DataStore | null;
  loading: Promise<DataStore> | null;
}

const GLOBAL_KEY = '__poojaro_store__';

function globals(): StoreGlobal {
  const holder = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreGlobal };
  holder[GLOBAL_KEY] ??= { store: null, loading: null };
  return holder[GLOBAL_KEY];
}

async function create(): Promise<DataStore> {
  const { backend } = serverEnv();
  if (backend === 'firestore') {
    // Dynamic so the local backend never pulls firebase-admin into the graph.
    const { FirestoreDataStore } = await import('./firestore/store');
    return new FirestoreDataStore();
  }
  const { LocalDataStore } = await import('./local/store');
  return new LocalDataStore();
}

/**
 * The active datastore, created once per process.
 *
 * Held on globalThis so Next's dev-server module reloading cannot end up with
 * two local adapters — which would each keep their own write queue and defeat
 * the serialisation that makes checkout atomic.
 */
export async function getStore(): Promise<DataStore> {
  const g = globals();
  if (g.store) return g.store;
  g.loading ??= create().then((store) => {
    g.store = store;
    g.loading = null;
    console.info(`[poojaro] Data backend: ${store.backend}`);
    return store;
  });
  return g.loading;
}

/** Which backend is live, without constructing it. Useful for admin diagnostics. */
export function activeBackend(): DataStore['backend'] {
  return serverEnv().backend;
}

export { SYSTEM_ACTOR } from './store';
export type {
  Actor,
  AnalyticsRange,
  AuditQuery,
  DataStore,
  InventoryQuery,
  OrderQuery,
  Page,
  PlaceOrderInput,
  PlaceOrderResult,
  ProductQuery,
  StockAdjustment,
} from './store';
