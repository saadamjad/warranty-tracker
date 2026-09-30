import type { Purchase, PurchaseFields } from "@/lib/db/types";
import { normaliseAmount } from "./amount";

/**
 * Applies user edits and marks each touched field as user-sourced, so later
 * automation never overwrites it (CLAUDE.md rule 3). Blank text clears the field (FR-11).
 * Throws InvalidAmountError for an amount that isn't a number.
 */
export function applyUserEdits(purchase: Purchase, edits: PurchaseFields, now: string): Purchase {
  const next: Purchase = { ...purchase, fieldMeta: { ...purchase.fieldMeta }, updatedAt: now };

  for (const [field, raw] of Object.entries(edits) as [keyof PurchaseFields, string | undefined][]) {
    next[field] = field === "amount" ? normaliseAmount(raw) : raw?.trim() || undefined;
    next.fieldMeta[field] = { source: "user", updatedAt: now };
  }

  return next;
}
