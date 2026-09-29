import { db } from "@/lib/db";
import type { BackupState } from "./status";
import { getAccount, getSyncStatus, getWatermark } from "./state";

/** Whether anything (or one purchase) still needs backing up: details newer than the watermark or files not uploaded. */
async function hasPending(watermark: string, purchaseId?: string): Promise<boolean> {
  const newer = (updatedAt: string) => updatedAt > watermark;
  if (purchaseId) {
    const purchase = await db.purchases.get(purchaseId);
    const [documents, warranties] = await Promise.all([
      db.documents.where("purchaseId").equals(purchaseId).toArray(),
      db.warranties.where("purchaseId").equals(purchaseId).toArray(),
    ]);
    return (
      (purchase !== undefined && newer(purchase.updatedAt)) ||
      documents.some((document) => newer(document.updatedAt) || (!document.uploadedAt && !document.pagesMissing)) ||
      warranties.some((warranty) => newer(warranty.updatedAt))
    );
  }
  const [purchases, documents, warranties, notUploaded] = await Promise.all([
    db.purchases.where("updatedAt").above(watermark).count(),
    db.documents.where("updatedAt").above(watermark).count(),
    db.warranties.where("updatedAt").above(watermark).count(),
    db.documents.filter((document) => !document.uploadedAt && !document.pagesMissing).count(),
  ]);
  return purchases + documents + warranties + notUploaded > 0;
}

/** Backup state in SPEC §6 terms, for the whole device or one purchase (FR-27, AC-13). */
export async function backupState(purchaseId?: string): Promise<BackupState> {
  const [account, status, watermark] = await Promise.all([getAccount(), getSyncStatus(), getWatermark()]);
  if (!account) return "device-only";
  if (!(await hasPending(watermark, purchaseId))) return "backed-up";
  return status.phase === "syncing" ? "backing-up" : "pending";
}
