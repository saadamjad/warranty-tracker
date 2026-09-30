import { PDF_TYPE } from "@/features/documents/lib/limits";
import { checkFile, checkPageCount } from "@/features/documents/lib/validate";
import type { QuarterTurns } from "./enhance";

// Pages collected on /add before saving. Photos build one multi-page document (EC-01);
// a PDF is already a whole document, so it is saved on its own (EC-15).

export type DraftPage = { id: string; file: File; turns: QuarterTurns };

export type Draft = { pages: DraftPage[]; message?: string };

export type DraftAction =
  | { type: "add"; files: File[]; makeId: () => string }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; by: -1 | 1 }
  | { type: "rotate"; id: string }
  | { type: "dismiss" }
  | { type: "reset" };

export const emptyDraft: Draft = { pages: [] };

export function isPdfDraft(draft: Draft): boolean {
  return draft.pages[0]?.file.type === PDF_TYPE;
}

export function draftReducer(draft: Draft, action: DraftAction): Draft {
  switch (action.type) {
    case "add":
      return addFiles(draft, action.files, action.makeId);
    case "remove":
      return { pages: draft.pages.filter((page) => page.id !== action.id) };
    case "move":
      return { pages: move(draft.pages, action.id, action.by) };
    case "rotate":
      return {
        pages: draft.pages.map((page) =>
          page.id === action.id ? { ...page, turns: ((page.turns + 1) % 4) as QuarterTurns } : page,
        ),
      };
    case "dismiss":
      return { pages: draft.pages };
    case "reset":
      return emptyDraft;
  }
}

function addFiles(draft: Draft, files: File[], makeId: () => string): Draft {
  const pages = [...draft.pages];
  for (const file of files) {
    const check = checkFile(file);
    if (!check.ok) return { pages, message: check.message };

    const mixing = pages.length > 0 && (file.type === PDF_TYPE || pages[0].file.type === PDF_TYPE);
    if (mixing) {
      return { pages, message: "A PDF is saved as its own document. Save this one first, then add the next." };
    }

    const count = checkPageCount(pages.length + 1);
    if (!count.ok) return { pages, message: count.message };

    pages.push({ id: makeId(), file, turns: 0 });
  }
  return { pages };
}

function move(pages: DraftPage[], id: string, by: -1 | 1): DraftPage[] {
  const from = pages.findIndex((page) => page.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= pages.length) return pages;
  const next = [...pages];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
