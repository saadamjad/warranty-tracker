import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { DEFAULT_REMINDER_PREFS, getReminderPrefs, setReminderPrefs } from "./prefs";

describe("reminder prefs", () => {
  afterEach(() => db.meta.clear());

  it("defaults to 30 + 7 days for warranties and 3 for returns (D-14, D-24)", async () => {
    expect(await getReminderPrefs()).toEqual(DEFAULT_REMINDER_PREFS);
  });

  it("saves changes and can turn off the final reminder", async () => {
    await setReminderPrefs({ finalDaysBefore: null, returnDaysBefore: 5 });
    expect(await getReminderPrefs()).toEqual({ warrantyDaysBefore: 30, finalDaysBefore: null, returnDaysBefore: 5, emailReminders: true });
  });
});
