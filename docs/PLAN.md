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
- [x] App shell + Home: promise line, Add Purchase button, recent list, manual "Enter details myself" at `/add`
- [x] Purchase detail `/p/[id]`: all fields inline-editable, notes, rename title (documents list lands with Phase 2)
- [x] Delete dialog: "This removes the purchase and its N documents. You can restore it from Recently Deleted for 30 days." (AC-18)
- [x] Recently Deleted `/settings/deleted`: restore / delete forever (D-29) — pulled forward so the delete promise holds

## Phase 2 — Capture & documents  [FR-04..07,13,14,24,35,36 · EC-01,03,11–16,20 · AC-4,5,15,16]
- [x] `/add`: Take photo (camera input) / Choose file (image, PDF); add more pages; reorder/remove pages
- [x] Validation: type/size limits (D-20) with friendly unsupported-file message + alternative
- [x] Camera denied/unavailable → file input `capture` falls back to file choice; manual path always shown
- [x] Image pipeline (canvas): orientation, grayscale/contrast, crop-to-content, manual rotate; keep original
- [x] PDF: store as-is, pages rendered on demand (pdf.js lazy) for preview; text layer for reading
- [x] Document type picker (default Receipt), documents list + "Add document" on existing purchase
- [x] In-context viewer (original ⇄ enhanced toggle, pages)
- [x] "Skip — enter details myself" always visible

## Phase 3 — Reading & review  [FR-08,09,10,46 · EC-06,19,25 · AC-2,14]
- [x] Self-host Tesseract assets in `public/tesseract/` (D-32)
- [x] Tesseract worker (lazy-loaded, progress "Reading your receipt…", timeout → manual path)
- [x] `features/extract/lib/parse.ts`: dates (many formats, reject ambiguous→candidates), amount+currency (total keywords, symbols, PKR/Rs/$/€/£ etc.), invoice/ref, serial/model, merchant (top lines), warranty period phrases; strip card-number patterns (rule 12); never assume currency (D-31)
- [x] Parser fixtures + tests (≥15 realistic receipts as text)
- [x] Review screen "We found these details": key fields only, low-confidence highlighted, candidate chips, empty stays empty
- [x] Save sets source=extracted for untouched fields, user for edited; re-extraction never touches user fields

## Phase 4 — Warranty & returns  [FR-17..20 · EC-07,08,24,28 · AC-9,10]
- [x] Warranty section: add many; start defaults to purchase date but independent; duration helper (1y/2y/custom)
- [x] `warrantyStatus(end, today)` → active / expiring (≤30d) / expired; badges; tests
- [x] Return deadline field + status
- [x] Reminder prefs (settings) + per-purchase toggle; in-app "Coming up" strip on Home
- [x] Browser notification (opt-in from Settings, while app open), each reminder once — email in Phase 10
- [x] Offer the warranty length printed on the receipt (one tap, never automatic)

## Phase 5 — Search  [FR-21,22 · EC-02 · AC-6,7]
- [x] MiniSearch index: title, product, model, serial, merchant, reference, notes, ocrText, year; typo allowance by word length (exact for numbers), prefix
- [x] Index kept current: rebuilt from live data on every local change (fast at personal scale)
- [x] Search box on Home + `/search`; results show purchase + matched field/document snippet; tests for typos/partials

## Phase 6 — Duplicates  [FR-34 · EC-17,18 · AC-17]
- [x] sha256 of original file; same hash → warn; same merchant+date+amount → softer warn
- [x] Dialog: Save anyway / Add to existing purchase / Cancel. Never deletes/merges automatically

## Phase 7 — Offline / PWA  [FR-25..27 · EC-21 · AC-11,13]
- [x] `manifest.webmanifest`, icons, `public/sw.js` (precache static shells + their assets, network-first navigations, cache-first build and reading files; D-33)
- [x] Status chip per purchase + global (wording SPEC §6)
- [x] Verify full flow offline in real Chrome (Playwright): add, manual fallback, save, list, typo search, edit, duplicate warning, on-device reading online and offline after first use

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
- [ ] Local 30-day purge of deleted items on app load (D-29)
- [ ] Cron purge of soft-deleted rows/files >30 days

## Phase 10 — Reminder emails & trust
- [ ] `/api/cron/reminders` daily (Vercel cron, CRON_SECRET), idempotent via ReminderLog
- [ ] `/privacy` page answering SPEC §7 questions; links from Home footer and backup prompt

## Phase 11 — Hardening & launch
- [ ] AC-1..20 checklist (automated where possible, rest manual) all pass, incl. delete → Recently Deleted → restore
- [ ] Accessibility (labels, focus, contrast), phone-width layout
- [ ] Deploy: Vercel + Neon + R2 + SMTP env; README setup steps
