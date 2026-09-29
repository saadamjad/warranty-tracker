import { findDocumentsByHash } from "@/features/documents/lib/documents";
import { listPurchases } from "@/features/purchases/lib/purchases";
import type { Purchase } from "@/lib/db/types";

// D-12: warn on the same file, or the same store + date + amount. Never delete or merge
// on our own; two real purchases can share store and date (EC-18).

/** Purchases that already hold a document with exactly these bytes. */
export async function purchasesWithSameFile(sha256: string): Promise<Purchase[]> {
  const ids = new Set((await findDocumentsByHash(sha256)).map((document) => document.purchaseId));
  return (await listPurchases()).filter((purchase) => ids.has(purchase.id));
}

/** Other purchases with the same store, date and amount. Needs all three to avoid false alarms. */
export async function similarPurchases(purchase: Purchase): Promise<Purchase[]> {
  const key = matchKey(purchase);
  if (!key) return [];
  return (await listPurchases()).filter((other) => other.id !== purchase.id && matchKey(other) === key);
}

function matchKey({ merchant, purchaseDate, amount }: Purchase): string | undefined {
  if (!merchant || !purchaseDate || !amount) return undefined;
  return [merchant.trim().toLowerCase(), purchaseDate, Number(amount).toFixed(2)].join("|");
}
