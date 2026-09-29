"use client";

import { setRemindersOff } from "@/features/purchases/lib/purchases";
import type { Purchase } from "@/lib/db/types";

export function RemindersToggle({ purchase }: { purchase: Purchase }) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={!purchase.remindersOff}
        onChange={(event) => setRemindersOff(purchase.id, !event.target.checked)}
        className="h-5 w-5"
      />
      Remind me before the warranty or return date
    </label>
  );
}
