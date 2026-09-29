"use client";

import { format } from "date-fns";
import { useState } from "react";
import { buildExport } from "../lib/exportZip";

/** One tap to take everything away: no lock-in (BR-07, AC-19). */
export function ExportButton() {
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");

  async function download() {
    setState("working");
    try {
      const url = URL.createObjectURL(await buildExport());
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-vault-${format(new Date(), "yyyy-MM-dd")}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setState("idle");
    } catch (error) {
      console.error("Export failed", error);
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={download} disabled={state === "working"} className="self-start rounded-card border border-line px-4 py-2 hover:bg-surface disabled:opacity-60">
        {state === "working" ? "Preparing your download…" : "Download all my purchases"}
      </button>
      <p className="text-sm text-muted">A ZIP with your original photos and files, plus a spreadsheet of the details.</p>
      {state === "failed" && (
        <p role="alert" className="text-danger">
          The download couldn&apos;t be prepared. Please try again.
        </p>
      )}
    </div>
  );
}
