import { db } from "./index";

// Small typed key-value store for device settings and sync bookkeeping.

export async function readMeta<T>(key: string, fallback: T): Promise<T> {
  const entry = await db.meta.get(key);
  return entry === undefined ? fallback : (entry.value as T);
}

export async function writeMeta<T>(key: string, value: T): Promise<void> {
  await db.meta.put({ key, value });
}
