"use client";

import { EditableField } from "@/features/purchases/components/EditableField";
import { parseDay } from "@/lib/dates";
import type { Purchase, Warranty } from "@/lib/db/types";
import { FIELD_LIMITS } from "@/lib/sync/schema";
import { useReceiptWarrantyMonths, useWarranties } from "../lib/hooks";
import { deadlineState, describeWarranty, endDateFrom } from "../lib/status";
import { addWarranty, removeWarranty, updateWarranty, type WarrantyFields } from "../lib/warranties";
import { StatusBadge } from "./StatusBadge";

const LENGTHS = [
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
];

/** Warranties on a purchase (FR-17, FR-18, AC-9). */
export function WarrantySection({ purchase }: { purchase: Purchase }) {
  const warranties = useWarranties(purchase.id);
  const receiptMonths = useReceiptWarrantyMonths(purchase.id);
  const noWarrantyYet = warranties.status === "ready" && warranties.value.length === 0;
  const offer = noWarrantyYet && receiptMonths.status === "ready" ? receiptMonths.value : undefined;

  return (
    <section aria-labelledby="warranty-heading" className="flex flex-col gap-3">
      <h2 id="warranty-heading" className="text-lg font-semibold">
        Warranty
      </h2>
      {warranties.status === "ready" &&
        warranties.value.map((warranty) => <WarrantyCard key={warranty.id} warranty={warranty} />)}
      {offer && purchase.purchaseDate && parseDay(purchase.purchaseDate) && <ReceiptWarrantyOffer months={offer} purchase={purchase} startDate={purchase.purchaseDate} />}
      <button
        type="button"
        // Starts on the purchase date by default; it stays editable for install-date warranties (EC-07).
        onClick={() => addWarranty(purchase.id, { startDate: purchase.purchaseDate })}
        className="self-start rounded-card border border-line px-4 py-2 font-medium hover:bg-surface"
      >
        + Add warranty
      </button>
    </section>
  );
}

/** Offered, never added silently (rule 4). */
function ReceiptWarrantyOffer({ months, purchase, startDate }: { months: number; purchase: Purchase; startDate: string }) {
  const length = months % 12 === 0 ? `${months / 12}-year` : `${months}-month`;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface p-3">
      <span>The receipt mentions a {length} warranty.</span>
      <button
        type="button"
        onClick={() => addWarranty(purchase.id, { startDate, endDate: endDateFrom(startDate, months) })}
        className="rounded-card bg-primary px-3 py-2 text-on-primary hover:bg-primary-hover"
      >
        Add it
      </button>
    </div>
  );
}

function WarrantyCard({ warranty }: { warranty: Warranty }) {
  const { startDate } = warranty;
  const badge = warranty.endDate ? statusOf(warranty.endDate) : undefined;
  const save = (field: keyof WarrantyFields) => (value: string) => updateWarranty(warranty.id, { [field]: value });

  return (
    <article className="flex flex-col gap-3 rounded-card border border-line p-3">
      {badge && <StatusBadge {...badge} />}
      <EditableField label="Provider" input="text" maxLength={FIELD_LIMITS.provider} value={warranty.provider} onSave={save("provider")} />
      <EditableField label="Starts" input="date" value={warranty.startDate} onSave={save("startDate")} />
      <EditableField label="Ends" input="date" value={warranty.endDate} onSave={save("endDate")} />
      {startDate && parseDay(startDate) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Length:</span>
          {LENGTHS.map(({ months, label }) => (
            <button
              key={months}
              type="button"
              onClick={() => updateWarranty(warranty.id, { endDate: endDateFrom(startDate, months) })}
              className="rounded-full border border-line px-3 py-1 hover:bg-surface"
            >
              {label}
            </button>
          ))}
          <span className="text-muted">or set the end date</span>
        </div>
      )}
      <EditableField label="Notes" input="multiline" maxLength={FIELD_LIMITS.notes} value={warranty.notes} onSave={save("notes")} />
      <button type="button" onClick={() => removeWarranty(warranty.id)} className="self-start text-sm text-danger hover:underline">
        Remove warranty
      </button>
    </article>
  );
}

function statusOf(endDate: string) {
  const state = deadlineState(endDate);
  return state && { status: state.status, text: describeWarranty(state) };
}
