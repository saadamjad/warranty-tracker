import { differenceInCalendarDays } from "date-fns";
import { parseTimestamp } from "@/lib/dates";
import { readMeta, writeMeta } from "@/lib/db/meta";

// Soft backup prompt (D-04, BUSINESS: account strategy): offered once there's something worth
// protecting, framed as keeping history safe, and easy to postpone indefinitely.

export const OFFER_AT = 3;
const MORE_PURCHASES = 5;
const MORE_DAYS = 30;

export type Dismissal = { atCount: number; at: string };

const KEY = "backupPromptDismissed";

export function shouldOfferBackup(count: number, signedIn: boolean, dismissal: Dismissal | null, today: Date = new Date()): boolean {
  if (signedIn || count < OFFER_AT) return false;
  if (!dismissal) return true;
  return count >= dismissal.atCount + MORE_PURCHASES || differenceInCalendarDays(today, parseTimestamp(dismissal.at) ?? today) >= MORE_DAYS;
}

export const getDismissal = () => readMeta<Dismissal | null>(KEY, null);

export function dismissBackupPrompt(count: number): Promise<void> {
  return writeMeta<Dismissal>(KEY, { atCount: count, at: new Date().toISOString() });
}
