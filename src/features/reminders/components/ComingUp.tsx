"use client";

import Link from "next/link";
import { useUpcoming } from "../lib/hooks";
import { upcomingText } from "../lib/text";
import { purchaseHref } from "@/lib/routes";

/** Home strip of deadlines inside their reminder window. Hidden when there's nothing (§6: no clutter). */
export function ComingUp() {
  const upcoming = useUpcoming();
  if (upcoming.status !== "ready" || upcoming.value.length === 0) return null;

  return (
    <section aria-labelledby="coming-up-heading" className="rounded-card border border-attention bg-attention-surface p-4">
      <h2 id="coming-up-heading" className="text-sm font-semibold uppercase tracking-wide">
        Coming up
      </h2>
      <ul className="mt-2 flex flex-col gap-1">
        {upcoming.value.map((item) => (
          <li key={`${item.kind}-${item.targetId}`}>
            <Link href={purchaseHref(item.purchaseId)} className="hover:underline">
              {upcomingText(item)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
