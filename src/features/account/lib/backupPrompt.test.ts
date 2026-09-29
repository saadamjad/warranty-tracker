import { describe, expect, it } from "vitest";
import { shouldOfferBackup } from "./backupPrompt";

const today = new Date("2026-09-30T12:00:00Z");

describe("shouldOfferBackup (D-04)", () => {
  it("offers from the 3rd saved purchase, never before", () => {
    expect(shouldOfferBackup(2, false, null, today)).toBe(false);
    expect(shouldOfferBackup(3, false, null, today)).toBe(true);
  });

  it("never offers when already backing up", () => {
    expect(shouldOfferBackup(10, true, null, today)).toBe(false);
  });

  it("re-offers only after 5 more purchases or 30 days", () => {
    const dismissal = { atCount: 3, at: "2026-09-20T12:00:00Z" };
    expect(shouldOfferBackup(7, false, dismissal, today)).toBe(false);
    expect(shouldOfferBackup(8, false, dismissal, today)).toBe(true);
    expect(shouldOfferBackup(4, false, { atCount: 3, at: "2026-08-30T12:00:00Z" }, today)).toBe(true);
  });
});
