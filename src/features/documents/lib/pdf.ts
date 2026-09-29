import type { PDFDocumentProxy } from "pdfjs-dist";

// pdf.js is large, so it loads only when a PDF is actually opened (STACK: lazy).
async function openPdf(file: Blob): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

export async function pdfPageCount(file: Blob): Promise<number> {
  const pdf = await openPdf(file);
  const count = pdf.numPages;
  await pdf.destroy();
  return count;
}

/** Renders one page (1-based) to a PNG for previews and on-device reading. */
export async function renderPdfPage(file: Blob, pageNumber: number, maxWidth = 1600): Promise<Blob> {
  const pdf = await openPdf(file);
  try {
    const page = await pdf.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: maxWidth / unscaled.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PDF page render failed"))), "image/png"),
    );
  } finally {
    await pdf.destroy();
  }
}

/** Text layer of a digital PDF; empty for scanned PDFs, which are read like photos. */
export async function pdfText(file: Blob): Promise<string> {
  const pdf = await openPdf(file);
  try {
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const content = await (await pdf.getPage(number)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n").trim();
  } finally {
    await pdf.destroy();
  }
}
