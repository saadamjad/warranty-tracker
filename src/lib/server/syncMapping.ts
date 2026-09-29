import type { Document as DocumentRow, Prisma, Purchase as PurchaseRow, Warranty as WarrantyRow } from "@prisma/client";
import type { Purchase } from "@/lib/db/types";
import type { DocumentWire, PageFileWire, PurchaseWire, WarrantyWire } from "@/lib/sync/schema";
import { pageKey } from "./storage";

// Converts between database rows and the sync wire format. Dates are calendar days
// (YYYY-MM-DD) on the wire and @db.Date columns in Postgres.

const day = (value: Date | null) => value?.toISOString().slice(0, 10);
const toDay = (value: string | undefined) => (value ? new Date(`${value}T00:00:00.000Z`) : null);
const iso = (value: Date | null) => value?.toISOString();
const opt = <T>(value: T | null) => value ?? undefined;

export function purchaseFromRow(row: PurchaseRow): PurchaseWire {
  return strip({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: iso(row.deletedAt),
    title: opt(row.title),
    productName: opt(row.productName),
    model: opt(row.model),
    serial: opt(row.serial),
    merchant: opt(row.merchant),
    purchaseDate: day(row.purchaseDate),
    amount: row.amount?.toFixed(2),
    currency: opt(row.currency),
    reference: opt(row.reference),
    notes: opt(row.notes),
    returnDeadline: day(row.returnDeadline),
    fieldMeta: row.fieldMeta as Purchase["fieldMeta"],
    remindersOff: row.remindersOff || undefined,
  });
}

export function purchaseToRow(purchase: PurchaseWire, userId: string, vaultId: string): Prisma.PurchaseUncheckedCreateInput {
  return {
    id: purchase.id,
    userId,
    vaultId,
    title: purchase.title ?? null,
    productName: purchase.productName ?? null,
    model: purchase.model ?? null,
    serial: purchase.serial ?? null,
    merchant: purchase.merchant ?? null,
    purchaseDate: toDay(purchase.purchaseDate),
    amount: purchase.amount ?? null,
    currency: purchase.currency ?? null,
    reference: purchase.reference ?? null,
    notes: purchase.notes ?? null,
    returnDeadline: toDay(purchase.returnDeadline),
    fieldMeta: purchase.fieldMeta,
    remindersOff: purchase.remindersOff ?? false,
    createdAt: new Date(purchase.createdAt),
    updatedAt: new Date(purchase.updatedAt),
    deletedAt: purchase.deletedAt ? new Date(purchase.deletedAt) : null,
  };
}

const TYPES = { RECEIPT: "receipt", INVOICE: "invoice", WARRANTY: "warranty", OTHER: "other" } as const;
const TYPE_ROWS = { receipt: "RECEIPT", invoice: "INVOICE", warranty: "WARRANTY", other: "OTHER" } as const;

/** Page files are recorded as storage keys; the wire lists them by index and kind. */
export function documentFromRow(row: DocumentRow): DocumentWire {
  const files: PageFileWire[] = row.originalKeys.map((_, index) => ({
    index,
    mimeType: row.mimeTypes[index] as PageFileWire["mimeType"],
    hasEnhanced: Boolean(row.enhancedKeys[index]),
  }));
  return strip({
    id: row.id,
    purchaseId: row.purchaseId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: iso(row.deletedAt),
    type: TYPES[row.type],
    pageCount: row.pageCount,
    sha256: row.sha256,
    sizeBytes: row.sizeBytes,
    ocrText: opt(row.ocrText),
    files,
  });
}

export function documentToRow(document: DocumentWire, userId: string): Prisma.DocumentUncheckedCreateInput {
  const files = [...document.files].sort((a, b) => a.index - b.index);
  return {
    id: document.id,
    purchaseId: document.purchaseId,
    userId,
    type: TYPE_ROWS[document.type],
    pageCount: document.pageCount,
    originalKeys: files.map((file) => pageKey(userId, document.id, file.index, "original")),
    // Empty string marks "no easier-to-read copy" while keeping positions aligned with pages.
    enhancedKeys: files.map((file) => (file.hasEnhanced ? pageKey(userId, document.id, file.index, "enhanced") : "")),
    mimeTypes: files.map((file) => file.mimeType),
    ocrText: document.ocrText ?? null,
    sha256: document.sha256,
    sizeBytes: document.sizeBytes,
    createdAt: new Date(document.createdAt),
    updatedAt: new Date(document.updatedAt),
    deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
  };
}

export function warrantyFromRow(row: WarrantyRow): WarrantyWire {
  return strip({
    id: row.id,
    purchaseId: row.purchaseId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: iso(row.deletedAt),
    provider: opt(row.provider),
    startDate: day(row.startDate),
    endDate: day(row.endDate),
    notes: opt(row.notes),
  });
}

export function warrantyToRow(warranty: WarrantyWire, userId: string): Prisma.WarrantyUncheckedCreateInput {
  return {
    id: warranty.id,
    purchaseId: warranty.purchaseId,
    userId,
    provider: warranty.provider ?? null,
    startDate: toDay(warranty.startDate),
    endDate: toDay(warranty.endDate),
    notes: warranty.notes ?? null,
    createdAt: new Date(warranty.createdAt),
    updatedAt: new Date(warranty.updatedAt),
    deletedAt: warranty.deletedAt ? new Date(warranty.deletedAt) : null,
  };
}

/** Drops undefined keys so records compare and store cleanly. */
function strip<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}
