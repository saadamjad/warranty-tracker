# Warranty Tracker (Personal Purchase Vault) — AI Rules

**Product:** a private, web-first, local-first vault for purchase records (receipts, invoices, warranties).
Promise: *"Save it now. Find it later."* Flow: Add Purchase → capture/import → "We found these details" → verify/edit → save → find.

## Read first
- `docs/SPEC.md` — condensed requirements (FR/BR/EC/AC IDs, decisions). The source of truth. Do not re-derive from anywhere else.
- `docs/BUSINESS.md` — the why: vision, personas, business model, risks, roadmap, feature gate. Read before product decisions.
- `docs/PLAN.md` — architecture + phased checklist. Progress is tracked by ticking boxes there.

## How to work
1. Open `docs/PLAN.md`, take the first unchecked task of the lowest open phase.
2. Read only the SPEC sections that task cites (IDs in brackets).
3. Implement → add/adjust tests → `npm run lint && npm test && npm run build`.
4. Tick the box in PLAN.md, commit (`feat(phase-N): …`). One task ≈ one commit.
5. If a requirement is unclear or conflicts, stop and ask the user; record the decision in SPEC §Decisions.

## Non-negotiable product rules
1. Capture takes seconds. No mandatory fields, no mandatory category (FR-12, FR-45).
2. Every extracted field stays editable, before and after save (FR-11).
3. A user edit is never overwritten by automation (field `source: 'user'` beats `'extracted'`).
4. Never guess silently: uncertain fields are highlighted; ambiguous values offer candidates.
5. Always keep the original document; extracted data is a convenience layer.
6. Never invent data (unknown date stays empty). Partial records are valid.
7. Offline is normal use, not an error. Local save must always succeed.
8. No signup wall. Account = optional backup/restore; soft prompt at 3rd saved purchase.
9. Nothing is ever auto-deleted or auto-merged (duplicates only warn).
10. Every automation failure has a manual path. No dead ends.
11. UI copy is plain language. Never show "OCR", "AI", "sync engine", "database" to users.
12. Payment-card/credential data is out of scope forever. Do not extract or store it.
Also: no dashboards/charts, sparse notifications, no legal claims about warranty/return eligibility.

## Stack
Next.js 15 (App Router, TS, Tailwind 4) · Dexie (IndexedDB, primary store) · MiniSearch (local fuzzy search) ·
Tesseract.js in a Web Worker (free on-device extraction) · Prisma 6 + Postgres (Neon free in prod) ·
Auth.js v5 (email magic link + Google) · S3-compatible storage (MinIO local, Cloudflare R2 prod) ·
Vercel (+ daily cron) · Vitest. Only free services.

## Folder map
```
src/app/                 routes (UI pages + api/ route handlers)
src/features/<name>/     purchases, documents, capture, extract, search, warranty,
                         reminders, sync, account, export — each: components/, lib/, *.test.ts
src/lib/db/              Dexie schema (client)
src/lib/server/          prisma client, auth, repo.ts (ALL server queries, scoped by userId), storage.ts
prisma/schema.prisma     server schema
public/sw.js             service worker (offline app shell)
docs/                    SPEC.md, PLAN.md
```

## Code conventions
- Server: every query goes through `src/lib/server/repo.ts` and is scoped by session userId. zod-validate every route input.
- Client data access only via `src/features/*/lib` functions, never raw Dexie in components.
- Every record: `id` (uuid, client-generated), `updatedAt`, `deletedAt` (soft delete), `fieldMeta` for per-field source/confidence/updatedAt.
- Small files, no premature abstractions, no new dependency without a reason in the commit message.
- Secrets only in `.env.local` (see `.env.example`). The repo is public.

## Commands
```
docker compose up -d        # postgres + minio
npm run dev                 # http://localhost:3000 (magic links print to terminal)
npx prisma migrate dev      # apply schema
npm test / npm run lint / npm run build
```
