import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes and new lines", () => {
    expect(csvCell('Metro, "Thokar"')).toBe('"Metro, ""Thokar"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(undefined)).toBe("");
  });

  it("defuses cells a spreadsheet would run as formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("-5")).toBe("'-5");
  });

  it("builds rows with CRLF line ends", () => {
    expect(toCsv(["a", "b"], [["1", 2]])).toBe("a,b\r\n1,2");
  });
});
