# ARCHITECTURE — How it fits together

Tech choices: `STACK.md`. Requirements: `SPEC.md`.

## Overview (local-first, D-15)
```
Browser (primary store)                                Server (backup/sync, optional account)
 UI (Next.js App Router, Tailwind)                      Route handlers /api/*
  └ features/*/lib  ─→ Dexie (IndexedDB)                  └ repo.ts (userId-scoped) ─→ Prisma ─→ Postgres
       purchases, documents(blobs), outbox                  storage.ts ─→ S3 (MinIO / R2), presigned URLs
  └ MiniSearch index (offline fuzzy search)              Auth.js v5 (magic link + Google)
  └ Tesseract.js Web Worker (on-device reading)          Vercel cron (daily): reminder emails, 30-day purge
  └ public/sw.js (offline app shell)
  └ sync: push outbox → /api/sync/push, pull /api/sync/pull?cursor=
```

## Folder map
```
src/app/                 routes (UI pages + api/ route handlers)
src/features/<name>/     purchases, documents, capture, extract, search, warranty,
                         reminders, sync, account, export — each: components/, lib/, *.test.ts
src/lib/db/              Dexie schema (client)
src/lib/server/          prisma.ts, auth.ts, repo.ts (ALL server queries, scoped by userId), storage.ts
prisma/schema.prisma     server schema
public/sw.js             service worker (offline app shell)
docs/                    SPEC, BUSINESS, STACK, ARCHITECTURE, PLAN
```

## Core mechanisms
- **Extractor interface** `extract(pages: Blob[]) → { text, fields: Record<Field,{value,confidence,candidates}> }`.
  v1 `TesseractExtractor` + `parse.ts` rules. A server extractor can plug in later behind the same interface.
- **Field meta** `fieldMeta[field] = { source:'extracted'|'user', confidence?, updatedAt }`.
- **Merge rule (D-17):** per field; `user` beats `extracted`; otherwise newer `updatedAt` wins. Documents are append-only.
- **Soft delete** everywhere (`deletedAt`); tombstones sync; restore from Recently Deleted clears `deletedAt` (D-29);
  local purge of items >30 days on app load; server purge after 30 days (D-19).
- **Guest → account (D-18):** upload everything local; if the account already has data, merge, never replace.
- **Future-proof:** purchases belong to a `Vault` (one personal vault per user now; family sharing later).

## Server schema (prisma/schema.prisma)
Auth.js tables (User, Account, Session, VerificationToken) +
- `Vault{id, ownerId}`
- `Purchase{id, vaultId, userId, title?, productName?, model?, serial?, merchant?, purchaseDate?, amount Decimal?, currency?, reference?, notes?, returnDeadline?, fieldMeta Json, remindersOff, updatedAt, deletedAt?}`
- `Document{id, purchaseId, userId, type, pageCount, originalKeys[], enhancedKeys[], ocrText?, sha256, sizeBytes, createdAt, updatedAt, deletedAt?}` (D-30)
- `Warranty{id, purchaseId, userId, provider?, startDate?, endDate?, notes?, updatedAt, deletedAt?}`
- `ReminderPref{userId, warrantyDaysBefore=30, finalDaysBefore=7?, returnDaysBefore=3, emailEnabled}` (D-14, D-24)
- `ReminderLog{id, userId, targetId, kind, dueAt, sentAt}` (idempotent emails)
- `Change{seq bigserial, userId, vaultId, entity, entityId, op, at}` (sync cursor)

All tables indexed by `userId`. Photos are stored one page row per image (original + enhanced copy);
a PDF is stored once as a single page row, with `pageCount` holding its real page count. Client Dexie mirrors Purchase / Document (+ page blobs) / Warranty, plus `outbox` and `meta`.

## Routes
- UI: `/` home · `/add` capture→review · `/p/[id]` detail/edit · `/search` · `/settings` (reminders, account, export, delete) · `/settings/deleted` (Recently Deleted, D-29) · `/privacy` · `/signin`
- API: `/api/auth/*` · `/api/sync/push` · `/api/sync/pull` · `/api/files/upload-url` · `/api/files/download-url` · `/api/export` · `/api/account` (DELETE) · `/api/cron/reminders` · `/api/cron/purge`
