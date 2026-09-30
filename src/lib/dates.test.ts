import { describe, expect, it } from "vitest";
import { parseDay, parseTimestamp } from "./dates";

describe("parseDay", () => {
  it("reads a real calendar day", () => {
    expect(parseDay("2026-03-03")?.getDate()).toBe(3);
  });

  it.each([undefined, "", "20266-03-03", "2026-02-30", "2026-13-01", "03/03/2026", "garbage"])("rejects %s", (value) => {
    expect(parseDay(value)).toBeUndefined();
  });
});

describe("parseTimestamp", () => {
  it("reads ISO timestamps and rejects junk", () => {
    expect(parseTimestamp("2026-03-03T10:00:00.000Z")).toBeInstanceOf(Date);
    expect(parseTimestamp("nope")).toBeUndefined();
  });
});
