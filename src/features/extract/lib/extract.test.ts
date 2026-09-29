import { afterEach, describe, expect, it, vi } from "vitest";
import { addDocument } from "@/features/documents/lib/documents";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { extractDocument } from "./extract";

const readText = vi.fn();
vi.mock("./reader", () => ({ readText: (...args: unknown[]) => readText(...args) }));
const pdfText = vi.fn();
vi.mock("@/features/documents/lib/pdf", () => ({
  pdfText: (...args: unknown[]) => pdfText(...args),
  renderPdfPage: vi.fn(async () => new Blob(["image"])),
}));

async function savedDocument(mimeType: string) {
  const { id } = await createPurchase();
  return addDocument({ purchaseId: id, type: "receipt", pages: [{ original: new Blob(["x"]), enhanced: new Blob(["e"]), mimeType }] });
}

describe("extractDocument", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("reads the easier copy of photos and keeps redacted text for search", async () => {
    readText.mockResolvedValueOnce("METRO\nTOTAL 700.00\nVISA 4111 1111 1111 1111");
    const document = await savedDocument("image/jpeg");
    const { fields } = await extractDocument(document.id);
    expect(await (readText.mock.calls[0][0] as Blob[])[0].text()).toBe("e");
    expect(fields.amount?.value).toBe("700.00");
    const stored = await db.documents.get(document.id);
    expect(stored?.ocrText).toContain("METRO");
    expect(stored?.ocrText).not.toContain("4111");
  });

  it("uses a digital PDF's own text without image reading", async () => {
    pdfText.mockResolvedValueOnce("Daraz.pk Order Number: 190234881203 Total: Rs. 3,499");
    const document = await savedDocument("application/pdf");
    const { fields } = await extractDocument(document.id);
    expect(readText).not.toHaveBeenCalled();
    expect(fields.reference?.value).toBe("190234881203");
  });

  it("reads a scanned PDF like photos", async () => {
    pdfText.mockResolvedValueOnce("");
    readText.mockResolvedValueOnce("TOTAL 100.00");
    const document = await savedDocument("application/pdf");
    expect((await extractDocument(document.id)).fields.amount?.value).toBe("100.00");
  });
});
