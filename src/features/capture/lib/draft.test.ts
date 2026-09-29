import { describe, expect, it } from "vitest";
import { draftReducer, emptyDraft, isPdfDraft, type Draft } from "./draft";

let n = 0;
const makeId = () => `page-${++n}`;
const photo = (name = "p.jpg") => new File(["x"], name, { type: "image/jpeg" });
const pdf = () => new File(["%PDF"], "invoice.pdf", { type: "application/pdf" });

function add(draft: Draft, ...files: File[]) {
  return draftReducer(draft, { type: "add", files, makeId });
}

describe("draftReducer", () => {
  it("collects photos as ordered pages", () => {
    const draft = add(emptyDraft, photo("1.jpg"), photo("2.jpg"));
    expect(draft.pages.map((p) => p.file.name)).toEqual(["1.jpg", "2.jpg"]);
  });

  it("reorders, rotates and removes pages", () => {
    let draft = add(emptyDraft, photo("1.jpg"), photo("2.jpg"));
    const [first, second] = draft.pages;
    draft = draftReducer(draft, { type: "move", id: second.id, by: -1 });
    expect(draft.pages.map((p) => p.file.name)).toEqual(["2.jpg", "1.jpg"]);
    draft = draftReducer(draft, { type: "rotate", id: first.id });
    expect(draft.pages.find((p) => p.id === first.id)?.turns).toBe(1);
    draft = draftReducer(draft, { type: "remove", id: first.id });
    expect(draft.pages).toHaveLength(1);
  });

  it("ignores moves past either end", () => {
    const draft = add(emptyDraft, photo());
    expect(draftReducer(draft, { type: "move", id: draft.pages[0].id, by: 1 }).pages).toBe(draft.pages);
  });

  it("explains unsupported files and keeps what was added", () => {
    const draft = add(emptyDraft, photo(), new File(["x"], "a.docx", { type: "application/msword" }));
    expect(draft.pages).toHaveLength(1);
    expect(draft.message).toMatch(/isn't a photo or PDF/);
  });

  it("keeps a PDF as its own document", () => {
    const draft = add(emptyDraft, pdf());
    expect(isPdfDraft(draft)).toBe(true);
    expect(add(draft, photo()).message).toMatch(/own document/);
    expect(add(add(emptyDraft, photo()), pdf()).message).toMatch(/own document/);
  });

  it("stops at 20 pages (D-20)", () => {
    const draft = add(emptyDraft, ...Array.from({ length: 21 }, () => photo()));
    expect(draft.pages).toHaveLength(20);
    expect(draft.message).toMatch(/up to 20 pages/);
  });
});
