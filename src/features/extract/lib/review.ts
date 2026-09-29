import type { Purchase, PurchaseField, PurchaseFields } from "@/lib/db/types";
import type { ExtractedFields, Found } from "./types";

/** Fields the review screen shows: the ones people need to find a purchase later (§6). */
export const REVIEW_FIELDS = ["productName", "merchant", "purchaseDate", "amount", "currency", "reference", "serial", "model"] as const satisfies readonly PurchaseField[];

export type ReviewField = (typeof REVIEW_FIELDS)[number];

export type Suggestions = Partial<Record<ReviewField, Found>>;

export function suggestionsFrom(fields: ExtractedFields): Suggestions {
  const { merchant, purchaseDate, amount, currency, reference, serial, model } = fields;
  return { merchant, purchaseDate, amount, currency, reference, serial, model };
}

/** What the form starts with: the user's own values win over anything read (rule 3);
 *  a fresh reading replaces an older reading. */
export function initialValues(purchase: Purchase, suggestions: Suggestions): Record<ReviewField, string> {
  return Object.fromEntries(
    REVIEW_FIELDS.map((field) => {
      const own = purchase.fieldMeta[field]?.source === "user" ? purchase[field] : undefined;
      return [field, own ?? suggestions[field]?.value ?? purchase[field] ?? ""];
    }),
  ) as Record<ReviewField, string>;
}

/**
 * Applies the reviewed form. A value left as suggested is marked extracted (with its
 * confidence); anything the user typed or chose is marked user. Unchanged user values
 * keep their meta, and empty stays empty (rule 6).
 */
export function applyReview(purchase: Purchase, suggestions: Suggestions, submitted: PurchaseFields, now: string): Purchase {
  const next: Purchase = { ...purchase, fieldMeta: { ...purchase.fieldMeta }, updatedAt: now };

  for (const field of REVIEW_FIELDS) {
    const value = submitted[field]?.trim() || undefined;
    const suggestion = suggestions[field];
    const unchanged = value === purchase[field];

    if (unchanged && purchase.fieldMeta[field]) continue;
    if (value === undefined && purchase[field] === undefined) continue;

    next[field] = value;
    next.fieldMeta[field] =
      value !== undefined && value === suggestion?.value && !suggestion.candidates
        ? { source: "extracted", confidence: suggestion.confidence, updatedAt: now }
        : { source: "user", updatedAt: now };
  }
  return next;
}
