# Purchase Vault (Warranty Tracker)

A private, web-first vault for receipts, invoices and warranties. **Save it now. Find it later.**

Works without an account and offline; an optional account backs up and restores your records.

## Status
Early stage: knowledge base and app skeleton. Progress is tracked in [`docs/PLAN.md`](docs/PLAN.md).

## Docs
| File | Answers |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Rules for contributors and AI agents — start here |
| [`docs/SPEC.md`](docs/SPEC.md) | What to build (requirements, decisions) |
| [`docs/BUSINESS.md`](docs/BUSINESS.md) | Why (vision, personas, roadmap) |
| [`docs/STACK.md`](docs/STACK.md) | Which tech (locked stack) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How it fits together |
| [`docs/PLAN.md`](docs/PLAN.md) | Build checklist |
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | How code is written |

## Run locally
Requires Node 20+ and Docker.
```bash
npm install
cp .env.example .env.local
docker compose up -d
npm run dev   # http://localhost:3000
```

## License
MIT — see [`LICENSE`](LICENSE). Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md).
