import { addMonths, differenceInCalendarDays, format, parseISO } from "date-fns";

/** "Expiring" window (D-14). */
export const EXPIRING_DAYS = 30;

export type WarrantyStatus = "active" | "expiring" | "expired";

export type DeadlineState = { status: WarrantyStatus; daysLeft: number };

/**
 * Status of a warranty or return date on `today`. The last day still counts as covered.
 * Expired items are shown as expired, never removed (EC-24).
 */
export function deadlineState(endDate: string, today: Date = new Date(), soonDays = EXPIRING_DAYS): DeadlineState {
  const daysLeft = differenceInCalendarDays(parseISO(endDate), today);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  return { status: daysLeft <= soonDays ? "expiring" : "active", daysLeft };
}

/** End date from a start date and a length in months ("1 year" = 12). */
export function endDateFrom(startDate: string, months: number): string {
  return format(addMonths(parseISO(startDate), months), "yyyy-MM-dd");
}

const days = (n: number) => (n === 1 ? "1 day" : `${n} days`);

/** Plain words for a warranty badge, e.g. "Warranty ends in 12 days". */
export function describeWarranty({ status, daysLeft }: DeadlineState): string {
  if (status === "expired") return daysLeft === -1 ? "Warranty expired yesterday" : `Warranty expired ${days(-daysLeft)} ago`;
  if (daysLeft === 0) return "Warranty ends today";
  if (status === "expiring") return `Warranty ends in ${days(daysLeft)}`;
  return "Under warranty";
}

/** Plain words for a return date. States the date only, never whether a return is allowed (EC-08). */
export function describeReturn({ status, daysLeft }: DeadlineState): string {
  if (status === "expired") return "Return window closed";
  if (daysLeft === 0) return "Last day to return";
  return `${days(daysLeft)} left to return`;
}
