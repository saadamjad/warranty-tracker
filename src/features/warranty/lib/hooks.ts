"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { listWarranties, warrantyMonthsOnReceipt } from "./warranties";

export function useWarranties(purchaseId: string) {
  return useLiveQuery(() => listWarranties(purchaseId), [purchaseId]);
}

export function useReceiptWarrantyMonths(purchaseId: string) {
  return useLiveQuery(() => warrantyMonthsOnReceipt(purchaseId), [purchaseId]);
}
