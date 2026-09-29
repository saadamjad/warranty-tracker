"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { DEFAULT_REMINDER_PREFS, getReminderPrefs } from "./prefs";
import { listWarranties, warrantyMonthsOnReceipt } from "./warranties";

export function useWarranties(purchaseId: string) {
  return useLiveQuery(() => listWarranties(purchaseId), [purchaseId]);
}

export function useReceiptWarrantyMonths(purchaseId: string) {
  return useLiveQuery(() => warrantyMonthsOnReceipt(purchaseId), [purchaseId]);
}

/** Saved reminder settings; defaults until loaded, so screens never wait on them. */
export function useReminderPrefs() {
  const prefs = useLiveQuery(getReminderPrefs, []);
  return prefs.status === "ready" ? prefs.value : DEFAULT_REMINDER_PREFS;
}
