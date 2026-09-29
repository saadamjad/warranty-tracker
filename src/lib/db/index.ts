import Dexie, { type EntityTable } from "dexie";
import type { DocumentPage, MetaEntry, Purchase, VaultDocument, Warranty } from "./types";

export class VaultDatabase extends Dexie {
  purchases!: EntityTable<Purchase, "id">;
  documents!: EntityTable<VaultDocument, "id">;
  pages!: Dexie.Table<DocumentPage, [string, number]>;
  warranties!: EntityTable<Warranty, "id">;
  meta!: EntityTable<MetaEntry, "key">;

  constructor(name = "purchase-vault") {
    super(name);
    // Only indexed fields are listed; other fields are stored but not indexed.
    this.version(1).stores({
      purchases: "id, updatedAt, deletedAt",
      documents: "id, purchaseId, sha256, updatedAt",
      pages: "[documentId+index], documentId",
      warranties: "id, purchaseId, endDate, updatedAt",
      outbox: "++seq, entityId",
      meta: "key",
    });
    // Changes are found by updatedAt against a sync watermark instead of an outbox (D-35).
    this.version(2).stores({ outbox: null });
  }
}

export const db = new VaultDatabase();
