import { describe, expect, it } from "vitest";
import type { Purchase } from "@/lib/db/types";
import { applyReview, initialValues, type Suggestions } from "./review";

const now = "2026-09-30T00:00:00.000Z";
const empty: Purchase = { id: "p", createdAt: now, updatedAt: now, fieldMeta: {} };
const suggestions: Suggestions = {
  merchant: { value: "Metro", confidence: 0.6 },
  amount: { value: "700.00", confidence: 0.9 },
  purchaseDate: { value: "2026-05-04", confidence: 0.4, candidates: ["2026-05-04", "2026-04-05"] },
};

describe("initialValues", () => {
  it("prefills suggestions and keeps unknowns empty", () => {
    expect(initialValues(empty, suggestions)).toMatchObject({ merchant: "Metro", amount: "700.00", serial: "" });
  });

  it("never replaces what the user typed earlier (rule 3)", () => {
    const edited: Purchase = { ...empty, merchant: "Metro Thokar", fieldMeta: { merchant: { source: "user", updatedAt: now } } };
    expect(initialValues(edited, suggestions).merchant).toBe("Metro Thokar");
  });
});

describe("applyReview", () => {
  it("marks accepted suggestions extracted and edits user (AC-2)", () => {
    const next = applyReview(empty, suggestions, { merchant: "Metro", amount: "650.00", productName: "Milk" }, now);
    expect(next.fieldMeta.merchant).toEqual({ source: "extracted", confidence: 0.6, updatedAt: now });
    expect(next.amount).toBe("650.00");
    expect(next.fieldMeta.amount?.source).toBe("user");
    expect(next.fieldMeta.productName?.source).toBe("user");
  });

  it("counts picking one of several candidates as the user's choice", () => {
    const next = applyReview(empty, suggestions, { purchaseDate: "2026-04-05" }, now);
    expect(next.fieldMeta.purchaseDate?.source).toBe("user");
  });

  it("leaves empty fields empty without meta (rule 6)", () => {
    const next = applyReview(empty, suggestions, { serial: "" }, now);
    expect(next.serial).toBeUndefined();
    expect(next.fieldMeta.serial).toBeUndefined();
  });

  it("keeps an unchanged user value's meta", () => {
    const meta = { source: "user" as const, updatedAt: "2026-01-01T00:00:00.000Z" };
    const edited: Purchase = { ...empty, merchant: "Metro Thokar", fieldMeta: { merchant: meta } };
    expect(applyReview(edited, suggestions, { merchant: "Metro Thokar" }, now).fieldMeta.merchant).toBe(meta);
  });
});
