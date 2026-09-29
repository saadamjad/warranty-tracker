import { describe, expect, it } from "vitest";
import { RECEIPTS } from "./fixtures/receipts";
import { parseReceipt } from "./parse";
import { CARD_REMOVED } from "./redact";
import type { ExtractField } from "./types";

const today = new Date("2026-09-30T12:00:00Z");
const FIELDS: ExtractField[] = ["merchant", "purchaseDate", "amount", "currency", "reference", "serial", "model", "warrantyMonths"];

describe("parseReceipt fixtures", () => {
  it("has at least 15 realistic receipts", () => expect(RECEIPTS.length).toBeGreaterThanOrEqual(15));

  it.each(RECEIPTS)("$name", ({ text, expected, ambiguous = [] }) => {
    const { fields } = parseReceipt(text, today);
    for (const field of FIELDS) {
      if (ambiguous.includes(field)) {
        expect(fields[field]?.candidates?.length, `${field} should offer a choice`).toBeGreaterThan(1);
      } else if (expected[field]) {
        expect(fields[field]?.value, field).toBe(expected[field]);
      }
    }
  });
});

describe("parseReceipt safety", () => {
  it("never keeps card numbers in the text (rule 12)", () => {
    const { text } = parseReceipt(RECEIPTS[1].text, today);
    expect(text).not.toContain("4111");
    expect(text).toContain(CARD_REMOVED);
  });

  it("invents nothing when the text is unreadable (rule 6)", () => {
    expect(parseReceipt("~~ ## ::", today).fields).toEqual({});
  });

  it("doesn't take unreadable totals or dates as values", () => {
    const noisy = RECEIPTS.find((receipt) => receipt.name.startsWith("Faded"))!;
    const { fields } = parseReceipt(noisy.text, today);
    expect(fields.purchaseDate).toBeUndefined();
    expect(fields.amount?.confidence ?? 0).toBeLessThan(0.7);
  });
});
