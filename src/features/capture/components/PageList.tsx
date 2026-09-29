"use client";

import { useObjectUrl } from "@/features/documents/lib/useObjectUrl";
import { PDF_TYPE } from "@/features/documents/lib/limits";
import type { DraftAction, DraftPage } from "../lib/draft";

type Props = { pages: DraftPage[]; dispatch: (action: DraftAction) => void };

export function PageList({ pages, dispatch }: Props) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Pages">
      {pages.map((page, index) => (
        <PageRow key={page.id} page={page} number={index + 1} last={index === pages.length - 1} dispatch={dispatch} />
      ))}
    </ol>
  );
}

type RowProps = { page: DraftPage; number: number; last: boolean; dispatch: Props["dispatch"] };

function PageRow({ page, number, last, dispatch }: RowProps) {
  const isPdf = page.file.type === PDF_TYPE;
  const { id } = page;

  return (
    <li className="flex items-center gap-3 rounded-card border border-line p-2">
      {isPdf ? <PdfBadge name={page.file.name} /> : <Thumbnail file={page.file} turns={page.turns} number={number} />}
      <div className="ml-auto flex flex-wrap justify-end gap-1 text-sm">
        {!isPdf && (
          <>
            <PageButton label={`Move page ${number} earlier`} disabled={number === 1} onClick={() => dispatch({ type: "move", id, by: -1 })}>
              ↑
            </PageButton>
            <PageButton label={`Move page ${number} later`} disabled={last} onClick={() => dispatch({ type: "move", id, by: 1 })}>
              ↓
            </PageButton>
            <PageButton label={`Turn page ${number}`} onClick={() => dispatch({ type: "rotate", id })}>
              ↻
            </PageButton>
          </>
        )}
        <PageButton label={`Remove page ${number}`} onClick={() => dispatch({ type: "remove", id })}>
          Remove
        </PageButton>
      </div>
    </li>
  );
}

function Thumbnail({ file, turns, number }: { file: File; turns: number; number: number }) {
  const url = useObjectUrl(file);
  if (!url) return <div className="h-20 w-20 rounded bg-surface" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local object URL, next/image can't optimise it
    <img
      src={url}
      alt={`Page ${number}`}
      className="h-20 w-20 rounded object-contain"
      style={{ transform: `rotate(${turns * 90}deg)` }}
    />
  );
}

function PdfBadge({ name }: { name: string }) {
  return (
    <div className="flex h-20 items-center gap-2">
      <span className="rounded bg-surface px-2 py-1 text-xs font-semibold">PDF</span>
      <span className="break-all">{name}</span>
    </div>
  );
}

type ButtonProps = { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode };

function PageButton({ label, disabled, onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="min-w-10 rounded-card border border-line px-2 py-2 hover:bg-surface disabled:opacity-40"
    >
      {children}
    </button>
  );
}
