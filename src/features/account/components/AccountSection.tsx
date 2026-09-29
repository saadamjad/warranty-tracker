"use client";

import Link from "next/link";
import { useState } from "react";
import { BackupStatus } from "@/features/sync/components/BackupStatus";
import { signOut } from "@/features/sync/lib/account";
import { syncNow } from "@/features/sync/lib/engine";
import { useAccount, useSyncStatus } from "@/features/sync/lib/hooks";
import type { SyncPhase } from "@/features/sync/lib/state";

const buttonClass = "rounded-card border border-line px-4 py-2 hover:bg-surface disabled:opacity-60";

/** Backup and restore in plain words (FR-28, FR-29, EC-22). */
export function AccountSection() {
  const account = useAccount();

  return (
    <section aria-labelledby="backup-heading" className="flex flex-col gap-3">
      <h2 id="backup-heading" className="text-lg font-semibold">
        Backup
      </h2>
      {account.status === "ready" && (account.value ? <SignedIn email={account.value.email} /> : <DeviceOnly />)}
    </section>
  );
}

function DeviceOnly() {
  return (
    <>
      <BackupStatus />
      <p className="text-muted">
        Your purchases are only on this device. If you lose or change it, they won&apos;t come with you unless you turn
        on backup.
      </p>
      <Link href="/signin" className="self-start rounded-card bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover">
        Turn on backup
      </Link>
    </>
  );
}

const PHASE_NOTES: Partial<Record<SyncPhase, string>> = {
  error: "The last backup didn't finish. It will try again automatically.",
};

function SignedIn({ email }: { email: string }) {
  const status = useSyncStatus();
  const [signOutFailed, setSignOutFailed] = useState(false);
  const phase = status.status === "ready" ? status.value.phase : "idle";
  const last = status.status === "ready" ? status.value.lastSyncedAt : undefined;

  if (phase === "signed-out") {
    return (
      <>
        <p>Your sign-in for {email} has expired. Your purchases are safe on this device.</p>
        <Link href="/signin" className="self-start rounded-card bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover">
          Sign in again
        </Link>
      </>
    );
  }

  return (
    <>
      <p>Backing up to {email}</p>
      <BackupStatus />
      {last && <p className="text-sm text-muted">Last backed up {new Date(last).toLocaleString()}</p>}
      {PHASE_NOTES[phase] && <p className="text-sm text-muted">{PHASE_NOTES[phase]}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={phase === "syncing"} onClick={() => void syncNow()} className={buttonClass}>
          Back up now
        </button>
        <button
          type="button"
          onClick={() => signOut().catch(() => setSignOutFailed(true))}
          className={buttonClass}
        >
          Sign out
        </button>
      </div>
      <p className="text-sm text-muted">Signing out keeps your purchases on this device.</p>
      {signOutFailed && (
        <p role="alert" className="text-danger">
          Couldn&apos;t sign out right now. Check your connection and try again.
        </p>
      )}
    </>
  );
}
