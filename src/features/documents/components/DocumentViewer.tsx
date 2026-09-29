"use client";

import { useEffect, useState } from "react";
import type { DocumentPage, VaultDocument } from "@/lib/db/types";
import { PDF_TYPE } from "../lib/limits";
import { usePages } from "../lib/hooks";
import { renderPdfPage } from "../lib/pdf";
import { useObjectUrl } from "../lib/useObjectUrl";

type Version = "enhanced" | "original";

/** Shows a document's pages inside the purchase (FR-24), original always one tap away (rule 5). */
export function DocumentViewer({ document }: { document: VaultDocument }) {
  const pages = usePages(document.id);
  const [index, setIndex] = useState(0);
  const [version, setVersion] = useState<Version>("enhanced");

  if (pages.status !== "ready") return <p className="text-muted">Loading…</p>;
  if (pages.value.length === 0) return <p className="text-danger">This document&apos;s file isn&apos;t on this device.</p>;

  const isPdf = pages.value[0].mimeType === PDF_TYPE;
  const current = isPdf ? pages.value[0] : pages.value[index];
  const hasEnhanced = !isPdf && Boolean(current.enhanced);

  return (
    <div className="flex flex-col gap-3">
      {isPdf ? (
        <PdfPage file={current.original} pageNumber={index + 1} />
      ) : (
        <ImagePage page={current} version={hasEnhanced ? version : "original"} pageNumber={index + 1} />
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {document.pageCount > 1 && (
          <Pager index={index} count={document.pageCount} onChange={setIndex} />
        )}
        {hasEnhanced && (
          <button
            type="button"
            onClick={() => setVersion(version === "enhanced" ? "original" : "enhanced")}
            className="rounded-card border border-line px-3 py-2 hover:bg-surface"
          >
            {version === "enhanced" ? "Show original photo" : "Show easier-to-read copy"}
          </button>
        )}
        <DownloadLink page={current} />
      </div>
    </div>
  );
}

function ImagePage({ page, version, pageNumber }: { page: DocumentPage; version: Version; pageNumber: number }) {
  const url = useObjectUrl(version === "enhanced" ? page.enhanced : page.original);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- local object URL, next/image can't optimise it
  return <img src={url} alt={`Page ${pageNumber}`} className="w-full rounded-card border border-line" />;
}

function PdfPage({ file, pageNumber }: { file: Blob; pageNumber: number }) {
  const [image, setImage] = useState<Blob>();
  const [failed, setFailed] = useState(false);
  const url = useObjectUrl(image);

  useEffect(() => {
    let current = true;
    renderPdfPage(file, pageNumber)
      .then((blob) => current && setImage(blob))
      .catch((error) => {
        console.warn("PDF preview failed", error);
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [file, pageNumber]);

  if (failed) return <p className="text-muted">A preview isn&apos;t available for this PDF. Use &quot;Open file&quot; to view it.</p>;
  if (!url) return <p className="text-muted">Loading…</p>;
  // eslint-disable-next-line @next/next/no-img-element -- rendered locally from the PDF
  return <img src={url} alt={`Page ${pageNumber}`} className="w-full rounded-card border border-line" />;
}

function Pager({ index, count, onChange }: { index: number; count: number; onChange: (index: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Previous page" disabled={index === 0} onClick={() => onChange(index - 1)} className="rounded-card border border-line px-3 py-2 disabled:opacity-40">
        ←
      </button>
      <span>
        Page {index + 1} of {count}
      </span>
      <button type="button" aria-label="Next page" disabled={index === count - 1} onClick={() => onChange(index + 1)} className="rounded-card border border-line px-3 py-2 disabled:opacity-40">
        →
      </button>
    </div>
  );
}

function DownloadLink({ page }: { page: DocumentPage }) {
  const url = useObjectUrl(page.original);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener" className="text-primary hover:underline">
      Open file
    </a>
  );
}
