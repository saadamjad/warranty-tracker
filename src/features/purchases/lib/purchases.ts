import { differenceInCalendarDays } from "date-fns";
import { parseTimestamp } from "@/lib/dates";
import { stamp } from "@/features/sync/lib/clock";
import { addPendingPurge } from "@/features/sync/lib/state";
import { db } from "@/lib/db";
import type { Purchase, PurchaseFields } from "@/lib/db/types";
import { applyUserEdits } from "./fields";

// Client data access for purchases; components call these, never Dexie directly.

/** How long a deleted purchase stays restorable (D-19, D-29). */
export const RESTORE_DAYS = 30;

/** Every field is optional: an empty purchase is a valid record (FR-12, EC-04/05). */
export async function createPurchase(fields: PurchaseFields = {}): Promise<Purchase> {
  const now = await stamp();
  const empty: Purchase = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, fieldMeta: {} };
  const purchase = applyUserEdits(empty, fields, now);
  await db.purchases.add(purchase);
  return purchase;
}

export async function getPurchase(id: string): Promise<Purchase | undefined> {
  return db.purchases.get(id);
}

export async function updatePurchase(id: string, edits: PurchaseFields): Promise<Purchase> {
  return updatePurchaseWith(id, (current, now) => applyUserEdits(current, edits, now));
}

/** Read-modify-write in one transaction, so concurrent edits can't lose each other. */
export async function updatePurchaseWith(id: string, change: (current: Purchase, now: string) => Purchase): Promise<Purchase> {
  const now = await stamp();
  return db.transaction("rw", db.purchases, async () => {
    const current = await db.purchases.get(id);
    if (!current) throw new Error(`Purchase ${id} not found`);
    const next = change(current, now);
    await db.purchases.put(next);
    return next;
  });
}

/** Newest first; excludes deleted purchases. */
export async function listPurchases(): Promise<Purchase[]> {
  const all = await db.purchases.orderBy("updatedAt").reverse().toArray();
  return all.filter((purchase) => !purchase.deletedAt);
}

/** Recently Deleted (D-29), most recently deleted first. */
export async function listDeletedPurchases(): Promise<Purchase[]> {
  const deleted = await db.purchases.where("deletedAt").above("").toArray();
  return deleted.sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

/** Soft delete (D-19): the purchase and its documents and warranties share one deletedAt. */
export async function softDeletePurchase(id: string): Promise<void> {
  const now = await stamp();
  await db.transaction("rw", db.purchases, db.documents, db.warranties, async () => {
    const stamp = { deletedAt: now, updatedAt: now };
    await db.purchases.update(id, stamp);
    await db.documents.where("purchaseId").equals(id).filter((d) => !d.deletedAt).modify(stamp);
    await db.warranties.where("purchaseId").equals(id).filter((w) => !w.deletedAt).modify(stamp);
  });
}

/**
 * Restores a purchase with the documents and warranties deleted together with it.
 * Items the user removed individually beforehand stay removed (D-29).
 */
export async function restorePurchase(id: string): Promise<void> {
  const now = await stamp();
  await db.transaction("rw", db.purchases, db.documents, db.warranties, async () => {
    const purchase = await db.purchases.get(id);
    if (!purchase?.deletedAt) return;
    const deletedTogether = <T extends { deletedAt?: string }>(item: T) =>
      item.deletedAt === purchase.deletedAt;
    const restore = { deletedAt: undefined, updatedAt: now };
    await db.purchases.update(id, restore);
    await db.documents.where("purchaseId").equals(id).filter(deletedTogether).modify(restore);
    await db.warranties.where("purchaseId").equals(id).filter(deletedTogether).modify(restore);
  });
}

/** Number of live documents on a purchase, for the delete confirmation (AC-18). */
export async function countDocuments(purchaseId: string): Promise<number> {
  return db.documents
    .where("purchaseId")
    .equals(purchaseId)
    .filter((d) => !d.deletedAt)
    .count();
}

/** Days until a deleted purchase is removed for good; never negative. */
export function daysLeftToRestore(deletedAt: string, today: Date = new Date()): number {
  return Math.max(0, RESTORE_DAYS - differenceInCalendarDays(today, parseTimestamp(deletedAt) ?? today));
}

/** Permanent removal, only from Recently Deleted after confirmation (D-29). Backup removes it too. */
export async function deletePurchaseForever(id: string): Promise<void> {
  await removePurchaseLocally(id);
  await addPendingPurge(id);
}

/** Removes a purchase with its documents, pages and warranties from this device only. */
export async function removePurchaseLocally(id: string): Promise<void> {
  await db.transaction("rw", [db.purchases, db.documents, db.pages, db.warranties], async () => {
    const documentIds = await db.documents.where("purchaseId").equals(id).primaryKeys();
    await db.pages.where("documentId").anyOf(documentIds).delete();
    await db.documents.bulkDelete(documentIds);
    await db.warranties.where("purchaseId").equals(id).delete();
    await db.purchases.delete(id);
  });
}

export async function setRemindersOff(id: string, remindersOff: boolean): Promise<void> {
  await db.purchases.update(id, { remindersOff, updatedAt: await stamp() });
}
