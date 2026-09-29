# Coding Standards

How code is written in this repo. Applies to humans and every coding agent (Claude Code, Cursor, others).

**Precedence:** `docs/SPEC.md` (product rules) → `CLAUDE.md` (workflow, conventions) → this file.
If a rule here conflicts with those, they win. Tech/dependency choices are governed by `docs/STACK.md`.

---

## 1. Understand before changing
- Read the relevant code and its callers, types, tests, and config before editing.
- Search for an existing implementation before writing a new one (component, hook, util, type, constant).
- Know what problem the change solves, where the responsibility belongs, and what else it touches.
- Match existing patterns. No new libraries, patterns, or abstractions without a stated reason.

## 2. Scope
- Keep changes focused on the task. Don't modify or refactor unrelated code.
- If a refactor is required to do the task, say why in the commit body.
- One PLAN.md task ≈ one commit (`feat(phase-N): …`), per `CLAUDE.md`. Each commit builds and passes tests.

## 3. Architecture & modularity
- Single responsibility, feature-oriented folders (`src/features/<feature>/`), explicit dependencies, low coupling.
- Server data access only through `src/lib/server/repo.ts`, scoped by session userId; zod-validate every route input.
- Client data access only through `src/features/*/lib`; never raw Dexie in components.
- Split a file when its responsibility is unclear, not to hit a line count.
- Reuse when it improves consistency; don't build generic abstractions for hypothetical needs.
- Don't duplicate business logic, validation, formatting, constants, config, or types. Centralize when it repeats.

## 4. Components & JSX
- Small, composable components with simple, predictable props and meaningful names.
- Keep business logic out of JSX; move it into hooks or `features/*/lib`.
- No nested ternaries, no large inline calculations, no repeated markup. Extract instead.
- Check for an existing component before creating a new one.

## 5. State
- Derive values instead of storing them when possible.
- Keep state local unless it clearly must be shared. Never duplicate the same state in two places.

## 6. Styling & theming
- Colors, typography, spacing, radii, shadows, breakpoints come from central design tokens / theme config.
- Don't hardcode the same design value in multiple places.

## 7. Accessibility
- Semantic HTML, real `<button>`/`<a>`, labels on inputs, meaningful alt text, visible focus, keyboard support.
- Don't convey meaning by color alone (relevant for highlighted uncertain fields).

## 8. Performance
- Avoid needless re-renders, requests, and state updates; consider large lists, images, lazy loading, bundle size.
- Use `memo`/`useMemo`/`useCallback` only for an identified or clearly expected problem. Simple code first.

## 9. Errors & edge cases
- Never swallow errors silently. Every failure has a manual path for the user (no dead ends).
- Handle: empty/null/partial data, invalid input, network failure and offline (offline is normal, not an error),
  slow responses, duplicate submissions, auth expiry, concurrent edits/race conditions, loading and empty states.
- User-facing messages are plain language (never "OCR", "AI", "sync", "database"). Developer errors carry
  enough context to debug without leaking sensitive data.

## 10. Security
- No secrets in code or commits; only `.env.local`. The repo is public.
- Validate all input, enforce authorization on every server query, guard against XSS/injection,
  and don't leak internals in error messages.
- Never extract or store payment-card or credential data.
- Don't disable a security check without a documented reason.

## 11. Types & contracts
- No `any` without a comment explaining why. Types model the real domain; reuse existing ones.
- When a contract changes, update every consumer in the same change.
- Don't break existing data or flows unless intended and documented; add migrations when the schema changes.

## 12. Naming & comments
- Names state intent. Avoid `data`, `temp`, `thing`, `handleStuff`, unclear abbreviations. Follow existing conventions.
- Comments explain *why* (business rule, constraint, workaround), never restate the code.
- Update the relevant doc (SPEC/ARCHITECTURE/etc.) when behavior or architecture changes.

## 13. Dependencies
- Follow `docs/STACK.md`. Before adding one: can the platform or existing code do it? Consider size,
  maintenance, security, license. Put the reason in the commit body.

## 14. Testing & verification
- Add or update tests for meaningful changes.
- Before calling work done, run: `npm run lint && npm run typecheck && npm test && npm run build`.
- Verify the changed behavior and check for regressions.
- **Never claim something was tested or run if it wasn't.** Report failures honestly.

## 15. Cleanup
- No dead code, unused imports/vars, commented-out code, stray `console.log`, or unexplained workarounds.

## 16. Done checklist
Before declaring a task complete:
- [ ] Existing code searched and reused where sensible; no duplicated logic.
- [ ] Change is focused; no unrelated edits.
- [ ] Edge cases, side effects, security, performance, and accessibility considered.
- [ ] Tests added/updated; lint, typecheck, tests, and build actually run and passing.
- [ ] Docs updated if behavior or architecture changed.
- [ ] Final diff reviewed; no secrets, debug code, or leftovers.

**Priorities when they conflict:** correctness → security → simplicity/readability → maintainability → performance → reuse.
