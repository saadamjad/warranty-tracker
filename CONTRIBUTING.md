# Contributing

Thanks for your interest in improving Warranty Tracker! This guide explains how to get involved.

## Before you start

Read [`CLAUDE.md`](CLAUDE.md) — the product rules, code conventions and a map of the docs in `docs/`.
For anything larger than a small fix, please open an issue first so we can agree on the approach.

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

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(phase-2): add multi-page capture`, `fix: …`, `docs: …`.
- Keep one logical change per PR, reference related requirement IDs and issues, and add or update tests.
- Include screenshots for UI changes.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
