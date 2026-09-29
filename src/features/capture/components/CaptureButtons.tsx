"use client";

import { ACCEPTED_TYPES } from "@/features/documents/lib/limits";

type Props = { hasPages: boolean; onFiles: (files: File[]) => void };

const buttonClass =
  "flex-1 cursor-pointer rounded-card px-4 py-4 text-center text-lg font-semibold focus-within:outline-2 focus-within:outline-primary";

/**
 * File inputs rather than a live camera: `capture` opens the phone camera, and where there is
 * no camera or permission is refused, the browser falls back to picking a file (FR-04, §5).
 */
export function CaptureButtons({ hasPages, onFiles }: Props) {
  function take(event: React.ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = ""; // allow picking the same file again after removing it
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className={`${buttonClass} bg-primary text-on-primary hover:bg-primary-hover`}>
        {hasPages ? "Take another photo" : "Take photo"}
        <input type="file" accept="image/*" capture="environment" onChange={take} className="sr-only" />
      </label>
      <label className={`${buttonClass} border border-line hover:bg-surface`}>
        {hasPages ? "Add more pages" : "Choose file"}
        <input type="file" accept={ACCEPTED_TYPES.join(",")} multiple onChange={take} className="sr-only" />
      </label>
    </div>
  );
}
