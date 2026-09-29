import { subDays } from "date-fns";
import { db } from "@/lib/db";
import { RESTORE_DAYS, removePurchaseLocally } from "./purchases";

/**
 * Removes from this device whatever has been in Recently Deleted for more than 30 days —
 * purchases, and documents or warranties removed on their own (D-29). The backup purges
 * its copy on the same schedule (D-19). Returns how many purchases were removed.
 */
export async function purgeExpiredLocally(today: Date = new Date()): Promise<number> {
  const cutoff = subDays(today, RESTORE_DAYS).toISOString();
  const expired = (record: { deletedAt?: string }) => Boolean(record.deletedAt && record.deletedAt < cutoff);

  const purchases = await db.purchases.filter(expired).primaryKeys();
  for (const id of purchases) await removePurchaseLocally(id);

  await db.transaction("rw", db.documents, db.pages, db.warranties, async () => {
    const documents = await db.documents.filter(expired).primaryKeys();
    await db.pages.where("documentId").anyOf(documents).delete();
    await db.documents.bulkDelete(documents);
    await db.warranties.filter(expired).delete();
  });
  return purchases.length;
}
