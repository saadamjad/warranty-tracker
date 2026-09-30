# SPEC — Personal Purchase Vault (condensed from BRD+FRS v1.0, 29 Sep 2026)

Source of truth for *what* to build. Why: `BUSINESS.md` · Tech: `STACK.md` · How: `ARCHITECTURE.md` · When: `PLAN.md`. IDs are stable; cite them in code/commits.

## 1. Product
- Private personal vault for purchase proof: receipts, invoices, warranty cards, product info, photos.
- Real problem: records are scattered and unfindable at the moment of need (return, warranty, repair, resale).
- NOT: accounting, finance manager, inventory, marketplace, social, insurance claims, enterprise DMS, AI chatbot.
- Primary persona: an ordinary individual managing own purchases. Family/business = later, must not complicate UX.
- Web-first; mobile app only after web is validated. User-first; monetization must never hurt trust/usability.
- Success sentence: *"I bought something, saved it quickly, and months later I could find exactly what I needed."*

## 2. Data model (business view)
| Object | Notes |
|---|---|
| Purchase | Central record. Title (renameable), productName, model, serial, merchant, purchaseDate, amount, currency, reference/invoice no., notes, returnDeadline. **All optional.** |
| Document | File(s) on a purchase. Type: Receipt / Invoice / Warranty / Other. Ordered pages. Original + enhanced copy. Extracted text. |
| Warranty | Many per purchase (EC-28). provider, startDate (independent of purchase date, EC-07), endDate, notes. |
| Reminder | Warranty expiry, return deadline. User can enable/disable and choose timing. |
| ServiceRecord, ShareLink, shared Vault | Future (P2). Schema must allow them later. |
Every field carries meta: `source` (extracted/user), `confidence`, `updatedAt`.

## 3. Functional requirements (P0 = MVP unless marked)
- FR-01 Home states purpose; one primary action **Add Purchase**. FR-02 Recent purchases list, no config.
- FR-03 Add purchase. FR-04 Camera capture where supported. FR-05 Import image/PDF.
- FR-06 Improve readability, keep original. FR-07 Detect boundary/orientation (best effort).
- FR-08 Extract fields. FR-09 Save manually if extraction incomplete. FR-10 Editable review screen before save.
- FR-11 All fields editable before & after save. FR-12 Save with fields missing.
- FR-13 Multiple documents per purchase. FR-14 Doc types. FR-15 Product details. FR-16 Purchase details.
- FR-17 Warranty dates/provider/notes. FR-18 Status active / expiring / expired. FR-19 Reminder timing settings.
- FR-20 Return deadline + optional reminder (**promoted to MVP**, see §8).
- FR-21 Search product, merchant, doc text, identifiers. FR-22 Tolerant to typos/partial terms/bad OCR.
- FR-23 Detail view: all info + all documents. FR-24 Preview doc inside purchase context.
- FR-25 Offline read. FR-26 Offline create/edit with local-saved state. FR-27 Status: saved locally / syncing / synced.
- FR-28 Account after experiencing product; messaging = backup/restore. FR-29 Restore on new device.
- FR-30 Delete purchase; clear whether documents go too. FR-31 Export (**basic in MVP**, §8).
- FR-32 Notes. FR-33 Product photo (P1). FR-34 Duplicate warning (**basic in MVP**, §8).
- FR-35 Multi-page documents. FR-36 Add separately captured docs to same purchase. FR-37 Share (P1).
- FR-38..44 Future (P2): expiring share links, service history, email import, photo discovery, barcode/QR, family sharing, natural-language search.
- FR-45 No mandatory category. FR-46 Every processing failure → manual path.

## 4. Business requirements (all P0 except noted)
BR-01 solve lost/scattered records · BR-02 no training needed · BR-03 minimal input after capture ·
BR-04 use before account · BR-05 privacy explained, minimum collection · BR-06 user reviews extraction ·
BR-07 no lock-in: deletion + export · BR-08 docs stay attached to correct purchase · BR-09 offline useful ·
BR-10 find by remembered info · BR-11 surface warranty info · BR-12 return deadlines, no policy promises (P1→MVP) ·
BR-13 personal scope · BR-14 sustainable model must not reduce trust (P1) · BR-15 web first ·
BR-16 retention via utility, no manipulation · BR-17 graceful failure · BR-18 scope discipline.

## 5. Edge cases → design rules
| ID | Case | Rule |
|---|---|---|
| EC-01 | Long receipt | One document, ordered pages |
| EC-02 | Many items on receipt | One purchase; full extracted text searchable |
| EC-03 | Receipt+warranty+repair doc | All attach to one purchase |
| EC-04/05 | Warranty only / receipt only | Partial record valid |
| EC-06 | Unknown date | Leave empty; never invent |
| EC-07 | Warranty starts at install | Warranty dates independent |
| EC-08 | Return window varies | Store explicit date only; no eligibility claims |
| EC-09/10 | Second-hand / gift | Save whatever exists |
| EC-11 | Handwritten | Manual entry always available |
| EC-12 | Faded thermal | Keep original; never promise restoration |
| EC-13 | Glare/fold | Enhance + offer retake/manual |
| EC-14/15/16 | Screenshot / PDF / WhatsApp file | Import manually |
| EC-17 | Same receipt twice | Warn, user decides |
| EC-18 | Same store+date, two purchases | Never auto-merge |
| EC-19 | Other currency | Keep currency as shown/entered |
| EC-20 | Partial capture | Warn, allow save |
| EC-21 | Offline at checkout | Local save always works |
| EC-22 | Guest changes device | Explain local-only data won't follow without account |
| EC-23 | Share with service center | Record easy to open; share in P1 |
| EC-24 | Expired warranty | Show expired; never delete |
| EC-25 | No product name | Use available info; user can rename |
| EC-26 | Wrong data saved | Editable after save |
| EC-27 | Replacement under warranty | Note/document in MVP |
| EC-28 | Extended warranty | Multiple warranties per purchase |

**Error handling (§22):** camera denied → explain + upload/manual · poor image → retry or manual ·
extraction incomplete → show found + fill rest · wrong extraction → fix before/after save ·
multiple possible values → offer choice, don't guess · unsupported file → say so + alternative ·
no network → continue offline · sync delay → local save shown separately from cloud state ·
duplicate → warn, never delete · delete mistake → soft delete, restorable from Recently Deleted for 30 days (D-29).

## 6. UX rules
- Home: Add Purchase (primary), Search, recent purchases, warranty/return reminders. No charts/dashboards.
- Capture: obvious camera/upload choice; confirm photo accepted; guide framing, never require perfection.
- Review: title "We found these details"; highlight uncertain fields; show only fields that matter; big Save.
- Search: one forgiving box; results show which purchase and which document/field matched. No filters in MVP.
- Status words: **Saved on this device · Backing up… · Backed up · Not backed up yet (safe on this device)**.
- Notifications sparse: warranty 30 days before (+ optional 7 days), return deadline, sync issue only if meaningful.
- Anti-patterns: forced signup, mandatory fields/categories, technical terms, dashboards, frequent reminders,
  silent guessing, auto-deleting duplicates, offline as error, hard export/deletion.

## 7. Trust & privacy
Plain-language answers visible in-app to: why trust us · who can access · what delete means · lost device ·
can I get my data back · is my original kept · what if it reads wrong. Minimum collection, no unrelated permissions,
no privacy claims stronger than reality. Each user's data isolated. Receipt reading runs on the device.

## 8. Decisions (resolved contradictions & gaps)
| ID | Decision |
|---|---|
| D-01..10 | From doc: user-first, web first, no forced signup, 3rd-purchase soft backup prompt, purchase-centered, editable extraction, offline required, simple UI, trust core, payment data excluded |
| D-11 | Basic export in MVP: ZIP of originals + purchases.csv + purchases.json (AC-19) |
| D-12 | Basic duplicate warning in MVP: same file hash, or same merchant+date+amount. Options: Save anyway / Add to existing / Cancel (AC-17) |
| D-13 | Return deadline + reminder in MVP (reuses reminder engine) |
| D-14 | Reminder default: 30 days before expiry, optional final 7 days; "expiring" = ≤30 days |
| D-15 | Local-first architecture: device is primary store, server = backup/sync |
| D-16 | Extraction: Tesseract.js on-device (free, offline); pluggable server extractor later |
| D-17 | Sync conflicts: per-field last-write-wins; user source beats extracted; documents append-only |
| D-18 | Guest→account: upload all local; if account has data, merge, never replace |
| D-19 | Delete = soft delete; server purge after 30 days; confirmation says so |
| D-20 | Limits: 20 MB/file, 20 pages/document |
| D-21 | Auth: email magic link + Google. Email via free SMTP/Resend; dev prints link to console |
| D-22 | English UI, any currency, default PKR (user-changeable) |
| D-23 | Hosting: Vercel Hobby + Neon free + Cloudflare R2 free. Public GitHub repo |
| D-24 | Return-deadline reminder default: 3 days before (user-changeable) |
| D-25 | Tech stack is locked in `STACK.md`; changing it needs a new decision here |
| D-26 | Prisma 6 (not 7): no driver adapters/config file needed, proven with Auth.js adapter |
| D-27 | npm + Node 20 LTS |
| D-28 | Commits are small and logical: each PLAN task lands as several commits (types → lib + tests → UI → wiring → docs); every commit builds and passes tests |
| D-29 | Recently Deleted in MVP: Settings lists soft-deleted purchases with days left; Restore or Delete forever (confirmed). Restore clears `deletedAt` on purchase + its documents/warranties and syncs as a normal update. Local items >30 days purged on app load; server purge per D-19 |
| D-30 | Every synced entity (Purchase, Document, Warranty) has `updatedAt` + `deletedAt`. Document content is append-only; type, page order and deletion are mutable |
| D-31 | Currency comes from the receipt when detected; otherwise empty on review with the user's default currency offered as a suggestion chip. Never filled silently |
| D-32 | Tesseract worker, core and English traineddata self-hosted under `public/tesseract/` and cached by the service worker; no CDN (offline reading) |
| D-33 | Pages are static shells: ids travel in the query string (`/p?id=`, `/add?to=`, `/search?q=`) so one cached page opens any purchase offline |
| D-34 | Local dev storage is S3Mock (`adobe/s3mock`), not MinIO: MinIO images are no longer on Docker Hub. Dev-only; prod stays Cloudflare R2 (D-23) |
| D-35 | Change tracking uses `updatedAt` against a per-device sync watermark instead of an outbox: every change already stamps `updatedAt`, so none can be missed; re-pushing an unchanged record is harmless |
| D-36 | Browser checks (`npm run e2e`) use `playwright-core` with the installed Chrome and `axe-core`, dev-only: offline, on-device reading and two-device sync can only be verified in a real browser. Run against a local production build before a release |
| D-37 | Every value a device saves must be one the backup accepts: text inputs stop at the backup's field limits (`FIELD_LIMITS`), a typed amount is stored as a plain decimal ("1,299" → "1299.00") and one that isn't a number is refused with a hint, never guessed. Local changes are stamped after the sync watermark (D-35), and a purchase deleted forever is never recreated by an older push (D-29) |

## 9. Acceptance scenarios (must all pass for Definition of Done)
AC-1 save receipt without account · AC-2 capture, review, fix one field, save · AC-3 save with missing fields ·
AC-4 attach warranty card to existing purchase · AC-5 purchase shows all docs together · AC-6 partial product name finds it ·
AC-7 merchant finds it · AC-8 edit after save · AC-9 warranty active/expiring/expired · AC-10 one meaningful reminder before expiry ·
AC-11 offline browsing · AC-12 create offline, sync later · AC-13 see local vs synced state · AC-14 continue manually when reading incomplete ·
AC-15 poor photo not a dead end · AC-16 save screenshot image · AC-17 duplicate warning never deletes ·
AC-18 delete and understand doc fate · AC-19 export path · AC-20 privacy promise understandable without technical docs.

## 10. Metrics (instrument privately, no content)
First successful save rate · time to first save · extraction correction rate · search success · repeat save ·
reminder usefulness · account conversion after meaningful use · restore success · delete/export success · trust feedback.
