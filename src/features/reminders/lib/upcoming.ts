import { displayTitle } from "@/features/purchases/lib/display";
import type { ReminderPrefs } from "@/features/warranty/lib/prefs";
import { deadlineState } from "@/features/warranty/lib/status";
import type { Purchase, Warranty } from "@/lib/db/types";

export type UpcomingKind = "warranty" | "return";

export type Upcoming = {
  purchaseId: string;
  /** The warranty or purchase the date belongs to. */
  targetId: string;
  kind: UpcomingKind;
  title: string;
  date: string;
  daysLeft: number;
};

/**
 * Dates inside their reminder window, soonest first. Purchases with reminders off and
 * deleted items are left out; passed dates are not "coming up" (FR-18..20).
 */
export function upcomingDeadlines(purchases: Purchase[], warranties: Warranty[], prefs: ReminderPrefs, today: Date): Upcoming[] {
  const live = new Map(purchases.filter((p) => !p.deletedAt && !p.remindersOff).map((p) => [p.id, p]));
  const items: Upcoming[] = [];

  for (const warranty of warranties) {
    const purchase = live.get(warranty.purchaseId);
    if (!purchase || !warranty.endDate || warranty.deletedAt) continue;
    const daysLeft = deadlineState(warranty.endDate, today)?.daysLeft;
    if (daysLeft !== undefined && daysLeft >= 0 && daysLeft <= prefs.warrantyDaysBefore) {
      items.push({ purchaseId: purchase.id, targetId: warranty.id, kind: "warranty", title: displayTitle(purchase), date: warranty.endDate, daysLeft });
    }
  }

  for (const purchase of live.values()) {
    if (!purchase.returnDeadline) continue;
    const daysLeft = deadlineState(purchase.returnDeadline, today)?.daysLeft;
    if (daysLeft !== undefined && daysLeft >= 0 && daysLeft <= prefs.returnDaysBefore) {
      items.push({ purchaseId: purchase.id, targetId: purchase.id, kind: "return", title: displayTitle(purchase), date: purchase.returnDeadline, daysLeft });
    }
  }

  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * The reminder due now for an item. Keys are stable so each one is shown
 * once: first warranty reminder, the optional final one, and the return reminder (D-14, D-24).
 */
export function reminderKey(item: Upcoming, prefs: ReminderPrefs): string {
  if (item.kind === "return") return `return:${item.targetId}:${item.date}`;
  const final = prefs.finalDaysBefore;
  if (final !== null && item.daysLeft <= final) return `warranty-final:${item.targetId}:${item.date}`;
  return `warranty:${item.targetId}:${item.date}`;
}
