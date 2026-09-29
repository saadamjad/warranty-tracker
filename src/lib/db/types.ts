// Local record shapes (device is the primary store, D-15). They mirror prisma/schema.prisma.
// Timestamps are ISO strings; calendar dates are 'YYYY-MM-DD' so no timezone can shift them.

export type FieldSource = "extracted" | "user";

export type FieldMeta = {
  source: FieldSource;
  /** 0..1, only for extracted values */
  confidence?: number;
  updatedAt: string;
};

export type PurchaseFields = {
  title?: string;
  productName?: string;
  model?: string;
  serial?: string;
  merchant?: string;
  purchaseDate?: string;
  /** Decimal as text to avoid float rounding, e.g. "1299.00" */
  amount?: string;
  currency?: string;
  reference?: string;
  notes?: string;
  returnDeadline?: string;
};

export type PurchaseField = keyof PurchaseFields;

/** Shared by every synced entity (D-30). */
export type SyncedRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type Purchase = SyncedRecord &
  PurchaseFields & {
    fieldMeta: Partial<Record<PurchaseField, FieldMeta>>;
    /** Per-purchase switch for warranty and return reminders (FR-19). */
    remindersOff?: boolean;
  };

export type DocumentType = "receipt" | "invoice" | "warranty" | "other";

export type VaultDocument = SyncedRecord & {
  purchaseId: string;
  type: DocumentType;
  pageCount: number;
  ocrText?: string;
  sha256: string;
  sizeBytes: number;
};

/** File content is kept apart from document rows so lists never load blobs. */
export type DocumentPage = {
  documentId: string;
  index: number;
  original: Blob;
  enhanced?: Blob;
  mimeType: string;
};

export type Warranty = SyncedRecord & {
  purchaseId: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type SyncEntity = "purchase" | "document" | "warranty";

export type OutboxEntry = {
  seq?: number;
  entity: SyncEntity;
  entityId: string;
  at: string;
};

export type MetaEntry = {
  key: string;
  value: unknown;
};
