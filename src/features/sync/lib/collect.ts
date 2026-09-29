import { db } from "@/lib/db";
import type { Purchase, VaultDocument, Warranty } from "@/lib/db/types";
import type { DocumentWire, PageFileWire, PurchaseWire, WarrantyWire } from "@/lib/sync/schema";

export type ChangeBatch = {
  purchases: PurchaseWire[];
  documents: DocumentWire[];
  warranties: WarrantyWire[];
  /** New watermark once this batch is stored on the server. */
  upTo: string;
};

type Item = { updatedAt: string } & ({ kind: "purchase"; record: Purchase } | { kind: "document"; record: VaultDocument } | { kind: "warranty"; record: Warranty });

/**
 * Records changed after `watermark`, oldest first, in batches of about `limit` (D-35).
 * The cut falls between timestamps so equal ones are never split, and a document's or
 * warranty's purchase is always included so the server can check ownership.
 */
export async function collectChanges(watermark: string, limit = 150): Promise<ChangeBatch | null> {
  const [purchases, documents, warranties] = await Promise.all([
    db.purchases.where("updatedAt").above(watermark).toArray(),
    db.documents.where("updatedAt").above(watermark).toArray(),
    db.warranties.where("updatedAt").above(watermark).toArray(),
  ]);

  const items: Item[] = [
    ...purchases.map((record) => ({ kind: "purchase" as const, record, updatedAt: record.updatedAt })),
    ...documents.map((record) => ({ kind: "document" as const, record, updatedAt: record.updatedAt })),
    ...warranties.map((record) => ({ kind: "warranty" as const, record, updatedAt: record.updatedAt })),
  ].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  if (items.length === 0) return null;

  const upTo = items[Math.min(limit, items.length) - 1].updatedAt;
  const batch = items.filter((item) => item.updatedAt <= upTo);

  const batchPurchases = new Map(batch.flatMap((item) => (item.kind === "purchase" ? [[item.record.id, item.record]] : [])));
  const parentIds = batch.flatMap((item) => (item.kind === "purchase" ? [] : [item.record.purchaseId]));
  for (const parent of await db.purchases.bulkGet(parentIds.filter((id) => !batchPurchases.has(id)))) {
    if (parent) batchPurchases.set(parent.id, parent);
  }

  const batchDocuments = batch.flatMap((item) => (item.kind === "document" ? [item.record] : []));
  return {
    purchases: [...batchPurchases.values()],
    documents: (await Promise.all(batchDocuments.map(documentToWire))).filter((document): document is DocumentWire => document !== null),
    warranties: batch.flatMap((item) => (item.kind === "warranty" ? [item.record] : [])),
    upTo,
  };
}

/** Document metadata plus which page files exist; device-only fields stay behind. */
async function documentToWire(document: VaultDocument): Promise<DocumentWire | null> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped: device-only
  const { uploadedAt, pagesMissing, remoteFiles, ...wire } = document;
  const pages = pagesMissing ? [] : await db.pages.where("documentId").equals(document.id).sortBy("index");
  const files: PageFileWire[] = pages.length
    ? pages.map((page) => ({ index: page.index, mimeType: page.mimeType as PageFileWire["mimeType"], hasEnhanced: Boolean(page.enhanced) }))
    : ((remoteFiles ?? []) as PageFileWire[]);
  // A document with no known files can't be described to the backup; it has nothing to back up.
  return files.length ? { ...wire, files } : null;
}
