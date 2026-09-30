import { z } from "zod";

// What devices and the server exchange. The server validates every request with these (zod,
// CLAUDE.md); limits keep one request bounded. Files travel separately via presigned URLs.

const timestamp = z.iso.datetime();
const day = z.iso.date();
const text = (max: number) => z.string().max(max).optional();
const id = z.uuid();

export const MAX_BATCH = 200;

/** Longest text the backup accepts per field. Inputs use the same limits, so a saved value can always be backed up. */
export const FIELD_LIMITS = {
  title: 300,
  productName: 300,
  model: 100,
  serial: 100,
  merchant: 300,
  currency: 10,
  reference: 100,
  notes: 5000,
  provider: 300,
} as const;

/** Read text is kept for search only; longer text is cut to this. */
export const MAX_OCR_TEXT = 100_000;

/** Amounts are stored as plain decimals, e.g. "1299.00". */
export const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

const fieldMeta = z.object({
  source: z.enum(["extracted", "user"]),
  confidence: z.number().min(0).max(1).optional(),
  updatedAt: timestamp,
});

const purchaseFields = z.enum([
  "title", "productName", "model", "serial", "merchant", "purchaseDate",
  "amount", "currency", "reference", "notes", "returnDeadline",
]);

export const purchaseWire = z.object({
  id,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
  title: text(FIELD_LIMITS.title),
  productName: text(FIELD_LIMITS.productName),
  model: text(FIELD_LIMITS.model),
  serial: text(FIELD_LIMITS.serial),
  merchant: text(FIELD_LIMITS.merchant),
  purchaseDate: day.optional(),
  amount: z.string().regex(AMOUNT_PATTERN).optional(),
  currency: text(FIELD_LIMITS.currency),
  reference: text(FIELD_LIMITS.reference),
  notes: text(FIELD_LIMITS.notes),
  returnDeadline: day.optional(),
  fieldMeta: z.partialRecord(purchaseFields, fieldMeta),
  remindersOff: z.boolean().optional(),
});

/** Which page files exist; the server derives storage keys from these. */
export const pageFileWire = z.object({
  index: z.number().int().min(0).max(19),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  hasEnhanced: z.boolean(),
});

export const documentWire = z.object({
  id,
  purchaseId: id,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
  type: z.enum(["receipt", "invoice", "warranty", "other"]),
  pageCount: z.number().int().min(1).max(20),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  sizeBytes: z.number().int().min(0).max(20 * 20 * 1024 * 1024),
  ocrText: text(MAX_OCR_TEXT),
  files: z.array(pageFileWire).min(1).max(20),
});

export const warrantyWire = z.object({
  id,
  purchaseId: id,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
  provider: text(FIELD_LIMITS.provider),
  startDate: day.optional(),
  endDate: day.optional(),
  notes: text(FIELD_LIMITS.notes),
});

export const pushBody = z.object({
  purchases: z.array(purchaseWire).max(MAX_BATCH),
  documents: z.array(documentWire).max(MAX_BATCH),
  warranties: z.array(warrantyWire).max(MAX_BATCH),
  /** Purchases the user deleted forever; removed on the server too (D-29). */
  purged: z.array(id).max(MAX_BATCH),
});

export const pullQuery = z.object({ cursor: z.string().regex(/^\d{1,19}$/).default("0") });

export type PurchaseWire = z.infer<typeof purchaseWire>;
export type DocumentWire = z.infer<typeof documentWire>;
export type WarrantyWire = z.infer<typeof warrantyWire>;
export type PageFileWire = z.infer<typeof pageFileWire>;
export type PushBody = z.infer<typeof pushBody>;

export type PullResponse = {
  purchases: PurchaseWire[];
  documents: DocumentWire[];
  warranties: WarrantyWire[];
  purged: string[];
  cursor: string;
  hasMore: boolean;
};
