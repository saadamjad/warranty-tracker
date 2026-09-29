"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { getPurchase, listPurchases } from "./purchases";

export function usePurchases() {
  return useLiveQuery(listPurchases, []);
}

export function usePurchase(id: string) {
  return useLiveQuery(() => getPurchase(id), [id]);
}
