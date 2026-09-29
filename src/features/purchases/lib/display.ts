import { format, parseISO } from "date-fns";
import type { Purchase } from "@/lib/db/types";

export const UNTITLED = "Untitled purchase";

/** Best available name when the user hasn't titled it (EC-25). */
export function displayTitle(purchase: Purchase): string {
  return purchase.title || purchase.productName || purchase.model || purchase.merchant || UNTITLED;
}

/** 'YYYY-MM-DD' → "3 Mar 2026". Unknown dates stay unknown (EC-06). */
export function formatDate(date: string | undefined): string | undefined {
  return date ? format(parseISO(date), "d MMM yyyy") : undefined;
}

/** Short secondary line for lists, e.g. "Metro · 3 Mar 2026". */
export function purchaseSummary(purchase: Purchase): string {
  const parts = [purchase.merchant, formatDate(purchase.purchaseDate)];
  if (purchase.title || purchase.productName || purchase.model) return parts.filter(Boolean).join(" · ");
  // Merchant is already the title in this case.
  return parts.slice(1).filter(Boolean).join(" · ");
}
