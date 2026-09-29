"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { backupState } from "./pending";
import { getAccount, getSyncStatus } from "./state";
import type { BackupState } from "./status";

/** Live backup state of this device, or of one purchase. */
export function useBackupState(purchaseId?: string): BackupState {
  const state = useLiveQuery(() => backupState(purchaseId), [purchaseId]);
  return state.status === "ready" ? state.value : "device-only";
}

export function useAccount() {
  return useLiveQuery(getAccount, []);
}

export function useSyncStatus() {
  return useLiveQuery(getSyncStatus, []);
}
