import type { PDFDocumentProxy } from "pdfjs-dist";

// pdf.js is large, so it loads only when a PDF is actually opened (STACK: lazy).
// Since pdf.js 6 the loading task owns teardown, so every caller goes through here.
async function withPdf<T>(file: Blob, read: (pdf: PDFDocumentProxy) => Promise<T>): Promise<T> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    return await read(await task.promise);
  } finally {
    await task.destroy();
  }
}

export function pdfPageCount(file: Blob): Promise<number> {
  return withPdf(file, async (pdf) => pdf.numPages);
}

/** Renders one page (1-based) to a PNG for previews and on-device reading. */
export function renderPdfPage(file: Blob, pageNumber: number, maxWidth = 1600): Promise<Blob> {
  return withPdf(file, async (pdf) => {
    const page = await pdf.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: maxWidth / unscaled.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PDF page render failed"))), "image/png"),
    );
  });
}

/** Text layer of a digital PDF; empty for scanned PDFs, which are read like photos. */
export function pdfText(file: Blob): Promise<string> {
  return withPdf(file, async (pdf) => {
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const content = await (await pdf.getPage(number)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    return pages.join("\n").trim();
  });
}
