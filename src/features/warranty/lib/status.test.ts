import { describe, expect, it } from "vitest";
import { deadlineState, describeReturn, describeWarranty, endDateFrom } from "./status";

const today = new Date(2026, 8, 30); // 30 Sep 2026, local time

describe("deadlineState (AC-9)", () => {
  it("is active well before the end", () => {
    expect(deadlineState("2027-03-01", today)).toMatchObject({ status: "active" });
  });

  it("is expiring within 30 days, including the last day", () => {
    expect(deadlineState("2026-10-30", today)).toEqual({ status: "expiring", daysLeft: 30 });
    expect(deadlineState("2026-09-30", today)).toEqual({ status: "expiring", daysLeft: 0 });
  });

  it("is expired the day after the end (EC-24)", () => {
    expect(deadlineState("2026-09-29", today)).toEqual({ status: "expired", daysLeft: -1 });
  });

  it("supports a shorter window for returns", () => {
    expect(deadlineState("2026-10-05", today, 3).status).toBe("active");
    expect(deadlineState("2026-10-02", today, 3).status).toBe("expiring");
  });
});

describe("endDateFrom", () => {
  it("adds months, clamping to month end", () => {
    expect(endDateFrom("2026-03-14", 12)).toBe("2027-03-14");
    expect(endDateFrom("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("describeWarranty / describeReturn", () => {
  it("uses plain words without eligibility claims (EC-08)", () => {
    expect(describeWarranty({ status: "active", daysLeft: 200 })).toBe("Under warranty");
    expect(describeWarranty({ status: "expiring", daysLeft: 12 })).toBe("Warranty ends in 12 days");
    expect(describeReturn({ status: "expiring", daysLeft: 0 })).toBe("Last day to return");
    expect(describeWarranty({ status: "expired", daysLeft: -3 })).toBe("Warranty expired 3 days ago");
    expect(describeReturn({ status: "expired", daysLeft: -3 })).toBe("Return window closed");
  });
});
