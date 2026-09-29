import { getPages, setDocumentText } from "@/features/documents/lib/documents";
import { PDF_TYPE } from "@/features/documents/lib/limits";
import { pdfText, renderPdfPage } from "@/features/documents/lib/pdf";
import { parseReceipt } from "./parse";
import { readText } from "./reader";
import type { Extraction } from "./types";

/** A digital PDF has real text; below this it's a scan and is read like a photo. */
const MIN_PDF_TEXT = 20;
/** Receipt details sit on the first pages; reading more only costs time. */
const MAX_SCANNED_PDF_PAGES = 3;

/**
 * Reads a saved document and suggests purchase details (FR-08). The read text is kept on the
 * document for search. Errors propagate so the caller can offer manual entry (FR-46).
 */
export async function extractDocument(documentId: string, onProgress?: (progress: number) => void): Promise<Extraction> {
  const pages = await getPages(documentId);
  if (pages.length === 0) return { text: "", fields: {} };

  const raw = pages[0].mimeType === PDF_TYPE ? await readPdf(pages[0].original, onProgress) : await readText(pages.map((page) => page.enhanced ?? page.original), onProgress);

  const extraction = parseReceipt(raw);
  await setDocumentText(documentId, extraction.text);
  return extraction;
}

async function readPdf(file: Blob, onProgress?: (progress: number) => void): Promise<string> {
  const text = await pdfText(file).catch(() => "");
  if (text.replace(/\s/g, "").length >= MIN_PDF_TEXT) return text;

  const images: Blob[] = [];
  for (let page = 1; page <= MAX_SCANNED_PDF_PAGES; page++) {
    try {
      images.push(await renderPdfPage(file, page));
    } catch {
      break; // fewer pages than the maximum
    }
  }
  return readText(images, onProgress);
}
