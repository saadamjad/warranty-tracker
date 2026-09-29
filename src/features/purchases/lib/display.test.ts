import { describe, expect, it } from "vitest";
import type { Purchase } from "@/lib/db/types";
import { UNTITLED, deleteMessage, displayTitle, formatDate, purchaseSummary } from "./display";

const purchase = (fields: Partial<Purchase>): Purchase => ({
  id: "p",
  createdAt: "",
  updatedAt: "",
  fieldMeta: {},
  ...fields,
});

describe("displayTitle", () => {
  it("prefers the user's title, then product, model, merchant", () => {
    expect(displayTitle(purchase({ title: "Mum's TV", productName: "TV" }))).toBe("Mum's TV");
    expect(displayTitle(purchase({ productName: "Kettle", merchant: "Metro" }))).toBe("Kettle");
    expect(displayTitle(purchase({ merchant: "Metro" }))).toBe("Metro");
    expect(displayTitle(purchase({}))).toBe(UNTITLED);
  });
});

describe("formatDate", () => {
  it("formats calendar dates and keeps unknown dates empty", () => {
    expect(formatDate("2026-03-03")).toBe("3 Mar 2026");
    expect(formatDate(undefined)).toBeUndefined();
  });
});

describe("purchaseSummary", () => {
  it("shows merchant and date without repeating the title", () => {
    expect(purchaseSummary(purchase({ productName: "Kettle", merchant: "Metro", purchaseDate: "2026-03-03" }))).toBe(
      "Metro · 3 Mar 2026",
    );
    expect(purchaseSummary(purchase({ merchant: "Metro", purchaseDate: "2026-03-03" }))).toBe("3 Mar 2026");
    expect(purchaseSummary(purchase({}))).toBe("");
  });
});

describe("deleteMessage", () => {
  it("says what happens to the documents and how to undo", () => {
    expect(deleteMessage(0)).toBe("This removes the purchase. You can restore it from Recently Deleted for 30 days.");
    expect(deleteMessage(1)).toMatch(/^This removes the purchase and its 1 document\./);
    expect(deleteMessage(3)).toMatch(/its 3 documents\./);
  });
});
