import { db } from "@/lib/db";
import type { Warranty } from "@/lib/db/types";

// Client data access for warranties; components call these, never Dexie directly.

export type WarrantyFields = Pick<Warranty, "provider" | "startDate" | "endDate" | "notes">;

function nowIso(): string {
  return new Date().toISOString();
}

/** A purchase can have many warranties, e.g. maker + extended (EC-28). All fields optional. */
export async function addWarranty(purchaseId: string, fields: WarrantyFields = {}): Promise<Warranty> {
  const now = nowIso();
  const warranty: Warranty = { id: crypto.randomUUID(), purchaseId, createdAt: now, updatedAt: now, ...clean(fields) };
  await db.warranties.add(warranty);
  return warranty;
}

export async function updateWarranty(id: string, fields: WarrantyFields): Promise<void> {
  await db.warranties.update(id, { ...clean(fields), updatedAt: nowIso() });
}

export async function removeWarranty(id: string): Promise<void> {
  const now = nowIso();
  await db.warranties.update(id, { deletedAt: now, updatedAt: now });
}

export async function listWarranties(purchaseId: string): Promise<Warranty[]> {
  const warranties = await db.warranties.where("purchaseId").equals(purchaseId).sortBy("createdAt");
  return warranties.filter((warranty) => !warranty.deletedAt);
}

/** All live warranties with an end date, for reminders. */
export async function listDatedWarranties(): Promise<Warranty[]> {
  const warranties = await db.warranties.where("endDate").above("").toArray();
  return warranties.filter((warranty) => !warranty.deletedAt);
}

/** Blank text clears a field rather than storing an empty string. */
function clean(fields: WarrantyFields): WarrantyFields {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value?.trim() || undefined]));
}
