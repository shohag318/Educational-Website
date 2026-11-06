import { applyDaltaSeed, seedData, type MockDb } from "./data";

/**
 * In-memory mutable store. The db is kept on `globalThis` so it survives
 * Next.js dev-mode module re-evaluation (HMR / separate route bundles).
 * It is reset whenever the server process restarts.
 */
const GLOBAL_KEY = "__educationalWebsiteMockDb__";

type GlobalWithDb = typeof globalThis & { [GLOBAL_KEY]?: MockDb };

const g = globalThis as GlobalWithDb;

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Returns the live (mutable) db. Created lazily from the seed. */
export function getStore(): MockDb {
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = deepClone(seedData);
  return g[GLOBAL_KEY] as MockDb;
}

/** Shallow-merge a patch into the live db (replaces whole collections). */
export function setStore(patch: Partial<MockDb>): MockDb {
  const db = getStore();
  Object.assign(db, patch);
  return db;
}

export function getCollection<K extends keyof MockDb>(key: K): MockDb[K] {
  return getStore()[key];
}

export function setCollection<K extends keyof MockDb>(key: K, value: MockDb[K]): void {
  getStore()[key] = value;
}

/** Re-seed the store. `dalta: true` loads the richer class XI dataset. */
export function resetStore(options?: { dalta?: boolean }): MockDb {
  const fresh = deepClone(seedData);
  if (options?.dalta) applyDaltaSeed(fresh);
  g[GLOBAL_KEY] = fresh;
  return fresh;
}

/** Generates a unique id for runtime-created entities, e.g. `enr_1001`. */
export function uid(prefix: string): string {
  const db = getStore();
  db.seq += 1;
  return `${prefix}_${db.seq}`;
}
