import { describe, expect, it } from "vitest";
import { AMOUNT_HINT, amountProblem, InvalidAmountError, normaliseAmount } from "./amount";

describe("normaliseAmount", () => {
  it("stores typed amounts as plain decimals", () => {
    expect(normaliseAmount("1,299.00")).toBe("1299.00");
    expect(normaliseAmount(" 12.5 ")).toBe("12.50");
    expect(normaliseAmount("6750")).toBe("6750.00");
  });

  it("keeps a blank amount empty (FR-12)", () => {
    expect(normaliseAmount("  ")).toBeUndefined();
    expect(normaliseAmount(undefined)).toBeUndefined();
  });

  it("refuses anything that isn't a number instead of guessing (rule 4)", () => {
    for (const typed of ["Rs 500", "abc", "12.ab", "99999999999999"]) {
      expect(() => normaliseAmount(typed)).toThrow(InvalidAmountError);
    }
  });
});

describe("amountProblem", () => {
  it("explains a bad amount in plain words", () => {
    expect(amountProblem("abc")).toBe(AMOUNT_HINT);
    expect(amountProblem("1,299")).toBeUndefined();
    expect(amountProblem("")).toBeUndefined();
  });
});
