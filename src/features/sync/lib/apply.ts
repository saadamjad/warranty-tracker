import { removePurchaseLocally } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import type { Purchase, VaultDocument } from "@/lib/db/types";
import { mergeLatest, mergePurchase } from "@/lib/sync/merge";
import type { DocumentWire, PullResponse } from "@/lib/sync/schema";

/**
 * Brings the backup's changes into this device with the same merge rules as the server,
 * so both end up equal (D-17). Never replaces local work wholesale (D-18).
 */
export async function applyPull(response: PullResponse): Promise<void> {
  await db.transaction("rw", [db.purchases, db.documents, db.pages, db.warranties], async () => {
    for (const incoming of response.purchases) {
      await db.purchases.put(mergePurchase(await db.purchases.get(incoming.id), incoming as Purchase));
    }
    for (const incoming of response.documents) {
      await db.documents.put(mergeDocument(await db.documents.get(incoming.id), incoming));
    }
    for (const incoming of response.warranties) {
      await db.warranties.put(mergeLatest(await db.warranties.get(incoming.id), incoming));
    }
    for (const id of response.purged) await removePurchaseLocally(id);
  });
}

function mergeDocument(local: VaultDocument | undefined, incoming: DocumentWire): VaultDocument {
  const { files, ...record } = incoming;
  if (!local) {
    // Files are in backup storage; they download separately (FR-29).
    return { ...record, remoteFiles: files, pagesMissing: true, uploadedAt: record.updatedAt };
  }
  const { uploadedAt, pagesMissing, remoteFiles } = local;
  return { ...mergeLatest(local, record), uploadedAt, pagesMissing, remoteFiles: remoteFiles ?? files };
}
