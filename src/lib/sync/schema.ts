import { z } from "zod";

// What devices and the server exchange. The server validates every request with these (zod,
// CLAUDE.md); limits keep one request bounded. Files travel separately via presigned URLs.

const timestamp = z.iso.datetime();
const day = z.iso.date();
const text = (max: number) => z.string().max(max).optional();
const id = z.uuid();

export const MAX_BATCH = 200;

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
  title: text(300),
  productName: text(300),
  model: text(100),
  serial: text(100),
  merchant: text(300),
  purchaseDate: day.optional(),
  amount: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).optional(),
  currency: text(10),
  reference: text(100),
  notes: text(5000),
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
  ocrText: text(100_000),
  files: z.array(pageFileWire).min(1).max(20),
});

export const warrantyWire = z.object({
  id,
  purchaseId: id,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
  provider: text(300),
  startDate: day.optional(),
  endDate: day.optional(),
  notes: text(5000),
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
