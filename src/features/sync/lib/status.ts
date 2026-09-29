// Where a purchase is kept, in the exact words of SPEC §6 (FR-27, AC-13).

export type BackupState = "device-only" | "backing-up" | "backed-up" | "pending";

export const BACKUP_LABELS: Record<BackupState, string> = {
  "device-only": "Saved on this device",
  "backing-up": "Backing up…",
  "backed-up": "Backed up",
  pending: "Not backed up yet (safe on this device)",
};
