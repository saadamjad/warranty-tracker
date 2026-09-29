"use client";

import type { BackupState } from "./status";

/** Without an account everything is saved on this device only; phase 8 adds real backup states. */
export function useBackupState(): BackupState {
  return "device-only";
}
