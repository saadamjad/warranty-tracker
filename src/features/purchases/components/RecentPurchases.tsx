"use client";

import Link from "next/link";
import { displayTitle, purchaseSummary } from "../lib/display";
import { usePurchases } from "../lib/hooks";

export function RecentPurchases() {
  const purchases = usePurchases();

  return (
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
        Recent purchases
      </h2>
      <RecentPurchasesBody result={purchases} />
    </section>
  );
}

function RecentPurchasesBody({ result }: { result: ReturnType<typeof usePurchases> }) {
  if (result.status === "loading") return <p className="mt-3 text-muted">Loading…</p>;

  if (result.status === "error") {
    return (
      <p role="alert" className="mt-3 text-danger">
        Your purchases couldn&apos;t be shown. Reload the page to try again.
      </p>
    );
  }

  if (result.value.length === 0) {
    return (
      <p className="mt-3 text-muted">
        Nothing saved yet. Your receipts, warranties and invoices will appear here.
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-line">
      {result.value.map((purchase) => (
        <li key={purchase.id}>
          <Link href={`/p/${purchase.id}`} className="block py-3 hover:bg-surface">
            <span className="block font-medium">{displayTitle(purchase)}</span>
            <span className="block text-sm text-muted">{purchaseSummary(purchase)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
