"use client";

import { EditableField } from "@/features/purchases/components/EditableField";
import { updatePurchase } from "@/features/purchases/lib/purchases";
import type { Purchase } from "@/lib/db/types";
import { useReminderPrefs } from "../lib/hooks";
import { deadlineState, describeReturn } from "../lib/status";
import { StatusBadge } from "./StatusBadge";

/** Last day to return, as the user knows it. We store the date only, never the store's policy (EC-08, FR-20). */
export function ReturnSection({ purchase }: { purchase: Purchase }) {
  const { returnDaysBefore } = useReminderPrefs();
  const deadline = purchase.returnDeadline;
  const state = deadline ? deadlineState(deadline, new Date(), returnDaysBefore) : undefined;

  return (
    <section aria-labelledby="return-heading" className="flex flex-col gap-3">
      <h2 id="return-heading" className="text-lg font-semibold">
        Return
      </h2>
      {state && <StatusBadge status={state.status} text={describeReturn(state)} />}
      <EditableField
        label="Last day to return"
        input="date"
        value={deadline}
        onSave={(value) => updatePurchase(purchase.id, { returnDeadline: value })}
      />
      <p className="text-sm text-muted">Check the store&apos;s own return policy — we only keep the date you enter.</p>
    </section>
  );
}
