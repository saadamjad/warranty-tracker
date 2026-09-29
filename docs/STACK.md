# STACK — Locked technology choices

Decided (SPEC D-25). Do not swap or add alternatives without a new Decision in SPEC §8. Only free services.

| Area | Choice | Why |
|---|---|---|
| Runtime / pkg manager | Node 20 LTS · npm | CI + Vercel default (D-27) |
| Framework | Next.js 15 App Router · React 19 · TypeScript strict | One codebase for UI + API routes |
| Styling | Tailwind CSS 4 | No component library; small plain UI |
| Local store (primary) | Dexie 4 (IndexedDB) | Local-first, offline, stores file blobs (D-15) |
| Search | MiniSearch 7 | Offline fuzzy/prefix search |
| Receipt reading | Tesseract.js (Web Worker, lazy-loaded) + own `parse.ts` rules | Free, on-device, private (D-16) |
| PDF preview | pdfjs-dist (lazy) | Thumbnails + text from PDFs |
| Dates | date-fns 4 | Tree-shakable, no locale magic |
| Validation | zod 4 | Every API input |
| Export | jszip | Client-side ZIP export, works offline (D-11) |
| Server DB | Postgres 16 · **Prisma 6** | Docker locally, Neon free in prod. Prisma 6 not 7: works with @auth/prisma-adapter without driver adapters (D-26) |
| Auth | Auth.js v5 (`next-auth` beta) + `@auth/prisma-adapter` | Email magic link (nodemailer) + Google (D-21) |
| File storage | `@aws-sdk/client-s3` + `s3-request-presigner` | MinIO locally, Cloudflare R2 in prod; presigned URLs |
| Email (prod) | Resend free tier via SMTP (nodemailer) | Magic links + reminder emails; dev prints to console |
| Hosting | Vercel Hobby + Vercel Cron (daily) | Reminders + 30-day purge |
| Tests | Vitest · fake-indexeddb · jsdom · @testing-library/react | Fast unit/component tests |
| CI | GitHub Actions: lint → test → build | `.github/workflows/ci.yml` |

**Not used:** state libraries (Redux/Zustand), UI kits, analytics SDKs, paid OCR/AI APIs, Firebase/Supabase, ORMs other than Prisma.

**Adding a dependency:** only if it removes real work; state the reason in the commit body; prefer lazy-loading anything large on the client.
