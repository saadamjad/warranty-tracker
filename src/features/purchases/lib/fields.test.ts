import { describe, expect, it } from "vitest";
import type { Purchase } from "@/lib/db/types";
import { applyUserEdits } from "./fields";

const base: Purchase = {
  id: "p1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  merchant: "Hi-Fi Store",
  fieldMeta: {
    merchant: { source: "extracted", confidence: 0.6, updatedAt: "2026-01-01T00:00:00.000Z" },
  },
};
const now = "2026-02-01T00:00:00.000Z";

describe("applyUserEdits", () => {
  it("marks edited fields as user-sourced", () => {
    const next = applyUserEdits(base, { merchant: "HiFi Store", productName: "Kettle" }, now);
    expect(next.merchant).toBe("HiFi Store");
    expect(next.fieldMeta.merchant).toEqual({ source: "user", updatedAt: now });
    expect(next.fieldMeta.productName).toEqual({ source: "user", updatedAt: now });
    expect(next.updatedAt).toBe(now);
  });

  it("clears a field when the user blanks it", () => {
    const next = applyUserEdits(base, { merchant: "  " }, now);
    expect(next.merchant).toBeUndefined();
    expect(next.fieldMeta.merchant?.source).toBe("user");
  });

  it("leaves untouched fields and the original record alone", () => {
    const next = applyUserEdits(base, { notes: "Gift" }, now);
    expect(next.fieldMeta.merchant?.source).toBe("extracted");
    expect(base.notes).toBeUndefined();
  });
});
