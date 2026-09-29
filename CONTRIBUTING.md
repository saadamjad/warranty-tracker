# Contributing

Thanks for your interest in improving Warranty Tracker! This guide explains how to get involved.

## Before you start

1. Read [`docs/SPEC.md`](docs/SPEC.md) — the source of truth for *what* we build (requirement IDs like `FR-12`, `EC-06`).
2. Read [`docs/PLAN.md`](docs/PLAN.md) — the architecture and the phased task checklist.
3. For anything larger than a small fix, please open an issue first so we can agree on the approach.

## Product rules (please respect these)

- Capture must stay fast: no mandatory fields, no mandatory category.
- Every extracted field stays editable; a user edit is never overwritten by automation.
- Never guess silently and never invent data — unknown values stay empty.
- Always keep the original document.
- Offline is normal use; saving locally must always succeed.
- Nothing is ever auto-deleted or auto-merged.
- User-facing copy is plain language (avoid terms like "OCR", "AI", "database").
- Payment-card and credential data is out of scope — never extract or store it.

## Development workflow

```bash
npm install
cp .env.example .env.local
docker compose up -d
npm run dev
```

Before opening a PR, make sure these pass:

```bash
npm run lint && npm test && npm run build
```

## Code conventions

- All server queries go through `src/lib/server/repo.ts` and are scoped by the session user. Validate every route input with zod.
- Components access client data only through `src/features/*/lib` functions, never raw Dexie.
- Records use client-generated UUIDs, `updatedAt`, soft delete via `deletedAt`, and per-field `fieldMeta`.
- Keep files small and avoid premature abstractions. Explain any new dependency in the PR.
- Never commit secrets. Only `.env.example` belongs in the repo.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(phase-2): add multi-page capture`, `fix: …`, `docs: …`.
- Keep one logical change per PR, reference related requirement IDs and issues, and add or update tests.
- Include screenshots for UI changes.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
