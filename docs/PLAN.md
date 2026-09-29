# PLAN — Build checklist

WHEN things get built. Rules: `CLAUDE.md` · What: `SPEC.md` · How: `ARCHITECTURE.md` · Tech: `STACK.md`.
Tick `[x]` when a task is done, tested and committed. Work top to bottom.

## Phase 0 — Setup
- [x] Deps installed per `STACK.md`; scripts `test`, `test:watch`, `db:migrate`, `typecheck`
- [x] `docker-compose.yml` (postgres:16, minio) + `.env.example`
- [x] Prisma schema + first migration; `src/lib/server/{prisma,repo,storage,auth}.ts` skeletons
- [x] Vitest config (jsdom, fake-indexeddb setup, `@/` alias); replace placeholder smoke test
- [x] CI: add typecheck step to existing `.github/workflows/ci.yml` (lint + typecheck + test + build)
- [x] git init, public GitHub repo, push

## Phase 1 — Local core  [FR-01,02,03,11,12,15,16,23,30,32,45 · AC-1,3,8,18]
- [x] Dexie schema `src/lib/db` (purchases, documents, pages blobs, warranties, outbox, meta)
- [x] `features/purchases/lib`: create/update(fieldMeta source=user)/softDelete/restore/list/listDeleted/get + tests (D-29)
- [ ] App shell + Home: promise line, Add Purchase button, search box, recent list, reminders strip
- [ ] Purchase detail `/p/[id]`: all fields inline-editable, notes, docs list, rename title
- [ ] Delete dialog: "This removes the purchase and its N documents. Recoverable for 30 days." (AC-18)

## Phase 2 — Capture & documents  [FR-04..07,13,14,24,35,36 · EC-01,03,11–16,20 · AC-4,5,15,16]
- [ ] `/add`: Take photo (camera input) / Choose file (image, PDF); add more pages; reorder/remove pages
- [ ] Validation: type/size limits (D-20) with friendly unsupported-file message + alternative
- [ ] Camera denied/unavailable → explain + upload/manual fallback
- [ ] Image pipeline (canvas): orientation, grayscale/contrast, crop-to-content, manual rotate; keep original
- [ ] PDF: store as-is, render first page thumbnail (pdf.js lazy) for preview/reading
- [ ] Document type picker (default Receipt), "Add document" on existing purchase
- [ ] In-context viewer (original ⇄ enhanced toggle, pages)
- [ ] "Skip — enter details myself" always visible

## Phase 3 — Reading & review  [FR-08,09,10,46 · EC-06,19,25 · AC-2,14]
- [ ] Self-host Tesseract assets in `public/tesseract/` (D-32)
- [ ] Tesseract worker (lazy-loaded, progress "Reading your receipt…", timeout → manual path)
- [ ] `features/extract/lib/parse.ts`: dates (many formats, reject ambiguous→candidates), amount+currency (total keywords, symbols, PKR/Rs/$/€/£ etc.), invoice/ref, serial/model, merchant (top lines), warranty period phrases; strip card-number patterns (rule 12); never assume currency (D-31)
- [ ] Parser fixtures + tests (≥15 realistic receipts as text)
- [ ] Review screen "We found these details": key fields only, low-confidence highlighted, candidate chips, empty stays empty
- [ ] Save sets source=extracted for untouched fields, user for edited; re-extraction never touches user fields

## Phase 4 — Warranty & returns  [FR-17..20 · EC-07,08,24,28 · AC-9,10]
- [ ] Warranty section: add many; start defaults to purchase date but independent; duration helper (1y/2y/custom)
- [ ] `warrantyStatus(end, today)` → active / expiring (≤30d) / expired; badges; tests
- [ ] Return deadline field + status
- [ ] Reminder prefs (settings) + per-purchase toggle; in-app "Coming up" list on Home
- [ ] Browser notification (if permitted, while app open) — email in Phase 10

## Phase 5 — Search  [FR-21,22 · EC-02 · AC-6,7]
- [ ] MiniSearch index: title, product, model, serial, merchant, reference, notes, ocrText, year; fuzzy 0.2, prefix
- [ ] Incremental index updates on save/delete; rebuild on load
- [ ] Results show purchase + matched field/document snippet; tests for typos/partials

## Phase 6 — Duplicates  [FR-34 · EC-17,18 · AC-17]
- [ ] sha256 of original file; same hash → warn; same merchant+date+amount → softer warn
- [ ] Dialog: Save anyway / Add to existing purchase / Cancel. Never deletes/merges automatically

## Phase 7 — Offline / PWA  [FR-25..27 · EC-21 · AC-11,13]
- [ ] `manifest.webmanifest`, icons, `public/sw.js` (cache app shell + Tesseract assets, network-first navigations)
- [ ] Status chip per purchase + global (wording SPEC §6)
- [ ] Verify full flow in DevTools offline

## Phase 8 — Accounts & sync  [FR-28,29 · D-03,04,17,18 · EC-22 · AC-12,13]
- [ ] Auth.js: Email (dev console link; prod SMTP) + Google; Prisma adapter; `/signin`
- [ ] Backup prompt after 3rd saved purchase (dismissible, re-offer later) + guest device-change explainer
- [ ] Outbox recording on every local change
- [ ] `/api/sync/push` + `/pull` with cursor; file upload via presigned URL; merge rules (tests!)
- [ ] First sign-in merge (never replace); restore on new device downloads records then files lazily
- [ ] Background sync on online event/interval; problem state with plain message

## Phase 9 — Export & deletion  [FR-31 · BR-07 · AC-18,19]
- [ ] Client export (works offline): ZIP of originals + purchases.csv + purchases.json (jszip)
- [ ] Account deletion (server data + files) with clear confirmation; local wipe option
- [ ] Recently Deleted `/settings/deleted`: restore / delete forever; local 30-day purge on load (D-29, AC-18)
- [ ] Cron purge of soft-deleted rows/files >30 days

## Phase 10 — Reminder emails & trust
- [ ] `/api/cron/reminders` daily (Vercel cron, CRON_SECRET), idempotent via ReminderLog
- [ ] `/privacy` page answering SPEC §7 questions; links from Home footer and backup prompt

## Phase 11 — Hardening & launch
- [ ] AC-1..20 checklist (automated where possible, rest manual) all pass, incl. delete → Recently Deleted → restore
- [ ] Accessibility (labels, focus, contrast), phone-width layout
- [ ] Deploy: Vercel + Neon + R2 + SMTP env; README setup steps
