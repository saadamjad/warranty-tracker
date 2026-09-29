import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDER_PREFS } from "@/features/warranty/lib/prefs";
import type { Purchase, Warranty } from "@/lib/db/types";
import { reminderKey, upcomingDeadlines } from "./upcoming";

const today = new Date(2026, 8, 30);
const at = "2026-01-01T00:00:00.000Z";
const purchase = (id: string, extra: Partial<Purchase> = {}): Purchase => ({ id, createdAt: at, updatedAt: at, fieldMeta: {}, productName: id, ...extra });
const warranty = (id: string, purchaseId: string, endDate: string): Warranty => ({ id, purchaseId, endDate, createdAt: at, updatedAt: at });

describe("upcomingDeadlines", () => {
  it("lists warranties within 30 days and returns within 3, soonest first", () => {
    const items = upcomingDeadlines(
      [purchase("TV"), purchase("Kettle", { returnDeadline: "2026-10-02" }), purchase("Fridge")],
      [warranty("w1", "TV", "2026-10-20"), warranty("w2", "Fridge", "2027-06-01")],
      DEFAULT_REMINDER_PREFS,
      today,
    );
    expect(items.map((i) => [i.title, i.kind, i.daysLeft])).toEqual([
      ["Kettle", "return", 2],
      ["TV", "warranty", 20],
    ]);
  });

  it("skips passed dates, deleted purchases and purchases with reminders off", () => {
    const items = upcomingDeadlines(
      [purchase("Old"), purchase("Gone", { deletedAt: at }), purchase("Muted", { remindersOff: true })],
      [warranty("w1", "Old", "2026-09-01"), warranty("w2", "Gone", "2026-10-10"), warranty("w3", "Muted", "2026-10-10")],
      DEFAULT_REMINDER_PREFS,
      today,
    );
    expect(items).toEqual([]);
  });
});

describe("reminderKey (AC-10)", () => {
  const item = { purchaseId: "p", targetId: "w", kind: "warranty" as const, title: "TV", date: "2026-10-20", daysLeft: 20 };

  it("uses the first warranty reminder, then the final one", () => {
    expect(reminderKey(item, DEFAULT_REMINDER_PREFS)).toBe("warranty:w:2026-10-20");
    expect(reminderKey({ ...item, daysLeft: 5 }, DEFAULT_REMINDER_PREFS)).toBe("warranty-final:w:2026-10-20");
  });

  it("has no final reminder when turned off", () => {
    expect(reminderKey({ ...item, daysLeft: 5 }, { ...DEFAULT_REMINDER_PREFS, finalDaysBefore: null })).toBe("warranty:w:2026-10-20");
  });
});
