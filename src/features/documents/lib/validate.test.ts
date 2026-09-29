import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "./limits";
import { checkFile, checkPageCount } from "./validate";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe("checkFile", () => {
  it("accepts photos, screenshots and PDFs (EC-14, EC-15)", () => {
    expect(checkFile(file("receipt.jpg", "image/jpeg"))).toEqual({ ok: true });
    expect(checkFile(file("Screenshot.png", "image/png"))).toEqual({ ok: true });
    expect(checkFile(file("invoice.pdf", "application/pdf"))).toEqual({ ok: true });
  });

  it("explains unsupported files and offers an alternative", () => {
    const result = checkFile(file("notes.docx", "application/vnd.openxmlformats"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/enter the details yourself/);
  });

  it("gives iPhone photos a specific way forward", () => {
    const result = checkFile(file("IMG_1.HEIC", ""));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/screenshot/);
  });

  it("rejects files over 20 MB (D-20)", () => {
    expect(checkFile(file("big.jpg", "image/jpeg", MAX_FILE_BYTES + 1)).ok).toBe(false);
  });
});

describe("checkPageCount", () => {
  it("allows up to 20 pages", () => {
    expect(checkPageCount(20).ok).toBe(true);
    expect(checkPageCount(21).ok).toBe(false);
  });
});
