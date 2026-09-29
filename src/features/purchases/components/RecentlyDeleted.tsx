"use client";

import { useState } from "react";
import type { Purchase } from "@/lib/db/types";
import { displayTitle } from "../lib/display";
import { useDeletedPurchases } from "../lib/hooks";
import { daysLeftToRestore, deletePurchaseForever, restorePurchase } from "../lib/purchases";

export function RecentlyDeleted() {
  const deleted = useDeletedPurchases();

  if (deleted.status === "loading") return <p className="text-muted">Loading…</p>;
  if (deleted.status === "error") {
    return (
      <p role="alert" className="text-danger">
        Deleted purchases couldn&apos;t be shown. Reload the page to try again.
      </p>
    );
  }
  if (deleted.value.length === 0) return <p className="text-muted">Nothing here. Deleted purchases appear here for 30 days.</p>;

  return (
    <ul className="divide-y divide-line">
      {deleted.value.map((purchase) => (
        <DeletedRow key={purchase.id} purchase={purchase} />
      ))}
    </ul>
  );
}

function DeletedRow({ purchase }: { purchase: Purchase }) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const daysLeft = daysLeftToRestore(purchase.deletedAt ?? purchase.updatedAt);

  async function run(action: (id: string) => Promise<void>) {
    try {
      await action(purchase.id);
    } catch (error) {
      console.error("Recently Deleted action failed", error);
      setFailed(true);
    }
  }

  return (
    <li className="py-3">
      <p className="font-medium">{displayTitle(purchase)}</p>
      <p className="text-sm text-muted">
        {daysLeft === 1 ? "1 day left to restore" : `${daysLeft} days left to restore`}
      </p>
      {failed && (
        <p role="alert" className="text-danger">
          That didn&apos;t work. Please try again.
        </p>
      )}
      {confirming ? (
        <div role="alertdialog" aria-label="Delete forever?" className="mt-2">
          <p>This can&apos;t be undone. The purchase and its documents are removed from this device.</p>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => run(deletePurchaseForever)} className="rounded-card bg-danger px-4 py-2 text-on-primary hover:bg-danger-hover">
              Delete forever
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-card border border-line px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => run(restorePurchase)} className="rounded-card bg-primary px-4 py-2 text-on-primary hover:bg-primary-hover">
            Restore
          </button>
          <button type="button" onClick={() => setConfirming(true)} className="text-danger hover:underline">
            Delete forever…
          </button>
        </div>
      )}
    </li>
  );
}
