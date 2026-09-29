"use client";

import { displayTitle, purchaseSummary } from "@/features/purchases/lib/display";
import type { Purchase } from "@/lib/db/types";

type Props = {
  reason: "same-file" | "similar";
  matches: Purchase[];
  onSaveAnyway: () => void;
  onAddToExisting: (purchase: Purchase) => void;
  onCancel: () => void;
};

const HEADINGS = {
  "same-file": "You've saved this file before",
  similar: "This looks like a purchase you already have",
};

const EXPLANATIONS = {
  "same-file": "It's already on:",
  similar: "Same store, date and amount as:",
};

/** Warns and lets the user decide; nothing is deleted or merged on our own (D-12, AC-17). */
export function DuplicateWarning({ reason, matches, onSaveAnyway, onAddToExisting, onCancel }: Props) {
  const existing = matches[0];

  return (
    <div role="alertdialog" aria-labelledby="duplicate-heading" className="flex flex-col gap-3 rounded-card border border-attention bg-attention-surface p-4">
      <h2 id="duplicate-heading" className="text-lg font-semibold">
        {HEADINGS[reason]}
      </h2>
      <p>{EXPLANATIONS[reason]}</p>
      <ul className="list-disc pl-5">
        {matches.map((purchase) => (
          <li key={purchase.id}>
            <span className="font-medium">{displayTitle(purchase)}</span>{" "}
            <span className="text-muted">{purchaseSummary(purchase)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Two purchases can look alike — you decide.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onSaveAnyway} className="rounded-card bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover">
          Save anyway
        </button>
        <button type="button" onClick={() => onAddToExisting(existing)} className="rounded-card border border-line bg-background px-4 py-2 hover:bg-surface">
          Add to &ldquo;{displayTitle(existing)}&rdquo; instead
        </button>
        <button type="button" onClick={onCancel} className="rounded-card px-4 py-2 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
