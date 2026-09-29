import type { FieldMeta, Purchase, PurchaseField, SyncedRecord } from "@/lib/db/types";

// Conflict rules shared by server and device (D-17). Pure functions: same inputs, same result
// on both sides, so every device converges on the same record.

const PURCHASE_FIELDS: PurchaseField[] = [
  "title",
  "productName",
  "model",
  "serial",
  "merchant",
  "purchaseDate",
  "amount",
  "currency",
  "reference",
  "notes",
  "returnDeadline",
];

/** Per field: a user edit beats an extracted value; otherwise the newer change wins. */
export function mergePurchase(current: Purchase | undefined, incoming: Purchase): Purchase {
  if (!current) return incoming;

  const newer = isNewer(incoming, current) ? incoming : current;
  const merged: Purchase = {
    ...newer,
    createdAt: earlier(current.createdAt, incoming.createdAt),
    updatedAt: later(current.updatedAt, incoming.updatedAt),
    fieldMeta: {},
  };

  for (const field of PURCHASE_FIELDS) {
    const winner = pickField(current.fieldMeta[field], incoming.fieldMeta[field]) === "incoming" ? incoming : current;
    if (winner[field] === undefined) delete merged[field];
    else merged[field] = winner[field];
    if (winner.fieldMeta[field]) merged.fieldMeta[field] = winner.fieldMeta[field];
  }
  return merged;
}

function pickField(current: FieldMeta | undefined, incoming: FieldMeta | undefined): "current" | "incoming" {
  if (!incoming) return "current";
  if (!current) return "incoming";
  if (current.source !== incoming.source) return incoming.source === "user" ? "incoming" : "current";
  return incoming.updatedAt > current.updatedAt ? "incoming" : "current";
}

/** Whole-record last write wins, for documents and warranties (D-17). */
export function mergeLatest<T extends SyncedRecord>(current: T | undefined, incoming: T): T {
  if (!current) return incoming;
  const newer = isNewer(incoming, current) ? incoming : current;
  return { ...newer, createdAt: earlier(current.createdAt, incoming.createdAt) };
}

function isNewer(a: SyncedRecord, b: SyncedRecord): boolean {
  return a.updatedAt > b.updatedAt;
}

function earlier(a: string, b: string): string {
  return a < b ? a : b;
}

function later(a: string, b: string): string {
  return a > b ? a : b;
}
