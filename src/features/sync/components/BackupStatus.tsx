"use client";

import { useBackupState } from "../lib/hooks";
import { BACKUP_LABELS, type BackupState } from "../lib/status";

const ICONS: Record<BackupState, string> = { "device-only": "●", "backing-up": "↻", "backed-up": "✓", pending: "●" };

/** Quiet chip saying where the data is. Local-only is a normal state, never a warning (rule 7). */
export function BackupStatus({ purchaseId }: { purchaseId?: string }) {
  const state = useBackupState(purchaseId);
  return (
    <span role="status" className="inline-flex items-center gap-1 text-sm text-muted">
      <span aria-hidden="true">{ICONS[state]}</span>
      {BACKUP_LABELS[state]}
    </span>
  );
}
