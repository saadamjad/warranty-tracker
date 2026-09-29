# Purchase Vault (Warranty Tracker) — Rules for AI agents and developers

A private, web-first, local-first vault for purchase records (receipts, invoices, warranties).
Promise: *"Save it now. Find it later."* Flow: Add Purchase → capture/import → "We found these details" → verify/edit → save → find.

## Knowledge base — one fact, one home
| Question | File |
|---|---|
| What must it do? (FR/BR/EC/AC IDs, UX, trust, Decisions D-xx) | `docs/SPEC.md` — source of truth |
| Why? (vision, personas, risks, roadmap, feature gate) | `docs/BUSINESS.md` |
| Which tech? (locked stack) | `docs/STACK.md` |
| How is it built? (data flow, schema, routes, sync, folders) | `docs/ARCHITECTURE.md` |
| What's next? (phased checklist) | `docs/PLAN.md` |
| How is code written? | `docs/CODING_STANDARDS.md` |

Read only what the current task needs. Don't restate these docs elsewhere; link to them.

## How to work
1. Open `docs/PLAN.md`, take the first unchecked task of the lowest open phase.
2. Read only the SPEC sections that task cites (IDs in brackets), plus ARCHITECTURE/STACK if relevant.
3. Implement → add/adjust tests → `npm run lint && npm run typecheck && npm test && npm run build`.
4. Commit in small logical steps (`feat|fix|test|refactor|docs|chore(phase-N): …`, cite IDs); tick the box in PLAN.md when the task is done (D-28).
5. If a requirement is unclear or conflicts, stop and ask the user; record the answer in SPEC §8 Decisions.

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

## Code conventions
- Server: every query goes through `src/lib/server/repo.ts`, scoped by session userId. zod-validate every route input.
- Client data access only via `src/features/*/lib` functions, never raw Dexie in components.
- Every record: `id` (client-generated uuid), `updatedAt`, `deletedAt` (soft delete), `fieldMeta` (per-field source/confidence/updatedAt).
- Small files, no premature abstractions. New dependency only per `docs/STACK.md` rules, with the reason in the commit body.
- Secrets only in `.env.local` (template: `.env.example`). The repo is public.
- Full coding standards (always follow): @docs/CODING_STANDARDS.md

## Commands
```
docker compose up -d        # postgres + minio
npm run dev                 # http://localhost:3000 (magic links print to terminal)
npm run db:migrate          # apply Prisma schema
npm test · npm run lint · npm run typecheck · npm run build
```
