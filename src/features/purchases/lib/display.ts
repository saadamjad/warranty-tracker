import { format } from "date-fns";
import { parseDay } from "@/lib/dates";
import type { Purchase } from "@/lib/db/types";

export const UNTITLED = "Untitled purchase";

/** Best available name when the user hasn't titled it (EC-25). */
export function displayTitle(purchase: Purchase): string {
  return purchase.title || purchase.productName || purchase.model || purchase.merchant || UNTITLED;
}

/** 'YYYY-MM-DD' → "3 Mar 2026". Unknown dates stay unknown (EC-06); an unreadable one is shown as stored. */
export function formatDate(date: string | undefined): string | undefined {
  const day = parseDay(date);
  return day ? format(day, "d MMM yyyy") : date || undefined;
}

/** Short secondary line for lists, e.g. "Metro · 3 Mar 2026". */
export function purchaseSummary(purchase: Purchase): string {
  const parts = [purchase.merchant, formatDate(purchase.purchaseDate)];
  if (purchase.title || purchase.productName || purchase.model) return parts.filter(Boolean).join(" · ");
  // Merchant is already the title in this case.
  return parts.slice(1).filter(Boolean).join(" · ");
}

/** Delete confirmation copy that says exactly what happens to documents (FR-30, AC-18, D-29). */
export function deleteMessage(documentCount: number): string {
  const what =
    documentCount === 0
      ? "This removes the purchase."
      : `This removes the purchase and its ${documentCount} ${documentCount === 1 ? "document" : "documents"}.`;
  return `${what} You can restore it from Recently Deleted for 30 days.`;
}
