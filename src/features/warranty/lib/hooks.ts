"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { listWarranties } from "./warranties";

export function useWarranties(purchaseId: string) {
  return useLiveQuery(() => listWarranties(purchaseId), [purchaseId]);
}
