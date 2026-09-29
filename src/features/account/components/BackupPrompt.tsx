"use client";

import Link from "next/link";
import { listPurchases } from "@/features/purchases/lib/purchases";
import { getAccount } from "@/features/sync/lib/state";
import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { dismissBackupPrompt, getDismissal, shouldOfferBackup } from "../lib/backupPrompt";

async function loadOffer() {
  const [purchases, account, dismissal] = await Promise.all([listPurchases(), getAccount(), getDismissal()]);
  return { count: purchases.length, show: shouldOfferBackup(purchases.length, Boolean(account), dismissal) };
}

/** Friendly, dismissible offer to protect saved purchases; never a wall (rule 8). */
export function BackupPrompt() {
  const offer = useLiveQuery(loadOffer, []);
  if (offer.status !== "ready" || !offer.value.show) return null;

  return (
    <section aria-labelledby="backup-prompt-heading" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <h2 id="backup-prompt-heading" className="font-semibold">
        Keep your {offer.value.count} purchases safe
      </h2>
      <p className="text-muted">
        Right now they&apos;re only on this device. Back them up to get them back if you lose or change your phone.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/signin" className="rounded-card bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover">
          Back up my purchases
        </Link>
        <button type="button" onClick={() => dismissBackupPrompt(offer.value.count)} className="rounded-card px-4 py-2 hover:underline">
          Not now
        </button>
        <Link href="/privacy" className="self-center text-sm text-muted hover:underline">
          How is my data kept?
        </Link>
      </div>
    </section>
  );
}
