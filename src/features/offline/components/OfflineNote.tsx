"use client";

import { useOnline } from "../lib/useOnline";

/** Offline is normal use, not an error (rule 7): a calm note, no alarm styling. */
export function OfflineNote() {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="rounded-card bg-surface px-4 py-2 text-sm text-muted">
      You&apos;re offline. Everything still works and saves on this device.
    </p>
  );
}
