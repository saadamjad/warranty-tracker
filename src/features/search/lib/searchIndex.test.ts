import { describe, expect, it } from "vitest";
import type { Purchase, VaultDocument } from "@/lib/db/types";
import { buildIndex, search, toEntries, typoAllowance } from "./searchIndex";

const at = "2026-01-01T00:00:00.000Z";
const purchase = (id: string, fields: Partial<Purchase>): Purchase => ({ id, createdAt: at, updatedAt: at, fieldMeta: {}, ...fields });
const document = (purchaseId: string, ocrText: string): VaultDocument => ({
  id: `d-${purchaseId}`, purchaseId, type: "receipt", pageCount: 1, sha256: "x", sizeBytes: 1, createdAt: at, updatedAt: at, ocrText,
});

const purchases = [
  purchase("tv", { productName: "Samsung Crystal UHD TV", merchant: "Hi-Fi Electronics", model: "UA55AU7700", purchaseDate: "2026-03-14" }),
  purchase("kettle", { productName: "Philips Kettle", merchant: "Metro Cash & Carry", purchaseDate: "2025-11-02" }),
  purchase("drill", { merchant: "Local Hardware", notes: "for the garage shelf" }),
  purchase("gone", { productName: "Samsung phone", deletedAt: at }),
];
const documents = [document("drill", "LOCAL HARDWARE\nBosch GSB 13 RE impact drill\nTOTAL 6,750")];
const index = buildIndex(toEntries(purchases, documents));
const ids = (query: string) => search(index, query).map((hit) => hit.id);

describe("search (FR-21, FR-22)", () => {
  it("finds by partial product name (AC-6)", () => expect(ids("sams")).toEqual(["tv"]));
  it("finds by store (AC-7)", () => expect(ids("metro")).toEqual(["kettle"]));
  it("tolerates typos", () => expect(ids("kettel")).toEqual(["kettle"]));
  it("finds text inside a document (EC-02)", () => expect(ids("bosch drill")).toEqual(["drill"]));
  it("finds by model and year", () => {
    expect(ids("UA55AU7700")).toEqual(["tv"]);
    expect(ids("2025")).toEqual(["kettle"]);
  });
  it("falls back to any word when not all match", () => expect(ids("philips toaster")).toEqual(["kettle"]));
  it("leaves out deleted purchases", () => expect(ids("phone")).toEqual([]));
  it("returns nothing for an empty query", () => expect(ids("  ")).toEqual([]));

  it("says which field matched with a snippet (§6)", () => {
    expect(search(index, "bosch")[0]).toMatchObject({ field: "Document text", snippet: "Bosch GSB 13 RE impact drill" });
    expect(search(index, "garage")[0]).toMatchObject({ field: "Notes", snippet: "for the garage shelf" });
  });
});

describe("typoAllowance", () => {
  it("is strict for short words and numbers", () => {
    expect(typoAllowance("tv")).toBe(0);
    expect(typoAllowance("2025")).toBe(0);
    expect(typoAllowance("metro")).toBe(1);
    expect(typoAllowance("kettel")).toBe(2);
  });
});
