import { describeReturn, describeWarranty } from "@/features/warranty/lib/status";
import type { Upcoming } from "./upcoming";

/** "TV — Warranty ends in 12 days" */
export function upcomingText(item: Upcoming): string {
  const state = { status: "expiring" as const, daysLeft: item.daysLeft };
  return `${item.title} — ${item.kind === "warranty" ? describeWarranty(state) : describeReturn(state)}`;
}
