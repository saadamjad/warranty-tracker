import { describe, expect, it } from "vitest";
import { findPurchaseDate } from "./dates";

const today = new Date("2026-09-30T12:00:00Z");
const find = (text: string) => findPurchaseDate(text, today);

describe("findPurchaseDate", () => {
  it.each([
    ["Date: 2026-03-14", "2026-03-14"],
    ["Date: 14 Mar 2026", "2026-03-14"],
    ["Invoice Date 14-Mar-26", "2026-03-14"],
    ["Dated 14th March, 2026", "2026-03-14"],
    ["Order placed March 14, 2026", "2026-03-14"],
    ["Date 25/03/2026", "2026-03-25"],
    ["Date 03/25/2026", "2026-03-25"],
    ["Date: 14.03.26", "2026-03-14"],
  ])("reads %s", (text, expected) => {
    const found = find(text);
    expect(found?.value).toBe(expected);
    expect(found?.candidates).toBeUndefined();
  });

  it("offers both readings for an ambiguous date instead of guessing (rule 4)", () => {
    const found = find("Date: 04/05/2026");
    expect(found?.value).toBe("2026-05-04");
    expect(found?.candidates).toEqual(["2026-05-04", "2026-04-05"]);
    expect(found?.confidence).toBeLessThan(0.7);
  });

  it("prefers the purchase date over warranty or due dates", () => {
    const text = "Warranty valid until 14/03/2027\nBill Date: 14/03/2026";
    expect(find(text)?.value).toBe("2026-03-14");
  });

  it("leaves the date empty when there is none (EC-06)", () => {
    expect(find("THANK YOU FOR SHOPPING")).toBeUndefined();
  });

  it("ignores impossible and future dates", () => {
    expect(find("Date 31/02/2026")).toBeUndefined();
    expect(find("Date 01/01/2031")).toBeUndefined();
  });

  it("gives other dates as candidates when none is labelled", () => {
    const found = find("12/08/2026 10:32\n...\n2026-08-20");
    expect(found?.value).toBe("2026-08-12");
    expect(found?.candidates).toContain("2026-08-20");
  });
});
