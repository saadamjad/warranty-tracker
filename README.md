# Purchase Vault (Warranty Tracker)

A private, web-first vault for receipts, invoices and warranties. **Save it now. Find it later.**

Snap or import a receipt, check the details it found, and find it months later by anything you remember.
Works without an account and offline; an optional account backs up and restores your records.

## What it does
- **Capture in seconds** — take a photo or pick a file (photos, screenshots, PDFs, multi-page). Nothing is mandatory.
- **Reads receipts on your device** — store, date, amount, currency, invoice/serial/model numbers and warranty
  length are suggested for you to check. Unsure values are marked; ambiguous ones offer choices. Card numbers are removed.
- **Keeps the original** — plus an easier-to-read copy. Receipt, warranty card and other papers stay together.
- **Remembers dates** — warranty and return deadlines, a "Coming up" list, optional notifications and emails.
- **Finds things** — one forgiving search box over names, stores, numbers, years and the text on your documents.
- **Works offline** — installable app; everything saves on the device first.
- **Optional backup** — sign in with an email link or Google to back up and restore on any device.
- **You stay in control** — Recently Deleted for 30 days, full ZIP export, delete your account and backup any time.

Progress and scope: [`docs/PLAN.md`](docs/PLAN.md).

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
Requires Node 22.13+ (see `.nvmrc`) and Docker.
```bash
npm install                      # also copies reader/PDF worker files into public/vendor
cp .env.example .env.local       # then set AUTH_SECRET: npx auth secret
docker compose up -d             # Postgres on 5433, S3-compatible storage on 9000
npm run db:migrate               # create the database tables
npm run dev                      # http://localhost:3000
```
Sign-in links are printed in the terminal (no email server needed locally). Everything except backup works
without Docker.

## Tests
```bash
npm run lint && npm run typecheck && npm test   # unit and component tests (no database)
npm run test:db                                 # server tests; needs TEST_DATABASE_URL (see .env.example)
```
Browser checks (acceptance scenarios, two-device sync, accessibility) run against a production build with Chrome installed:
```bash
npm run build && npx next start -p 3100 > /tmp/vault-e2e.log 2>&1 &
npm run e2e
```

## Deploy (free tiers: Vercel + Neon + Cloudflare R2 + Resend)
1. **Database — [Neon](https://neon.tech):** create a project. Use the *pooled* connection string for the app
   (`DATABASE_URL`, add `?sslmode=require&pgbouncer=true&connection_limit=1`) and run migrations once from your
   machine with the *direct* string: `DATABASE_URL="<direct url>" npx prisma migrate deploy`.
   Repeat after pulling changes that add files under `prisma/migrations/`.
2. **Files — [Cloudflare R2](https://developers.cloudflare.com/r2/):** create a bucket and an API token with
   read/write on it. Set `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`,
   `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Browsers upload directly, so add a CORS policy:
   ```json
   [{ "AllowedOrigins": ["https://<your-domain>"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
3. **Email — [Resend](https://resend.com):** verify a sending domain, then set `SMTP_HOST=smtp.resend.com`,
   `SMTP_PORT=587`, `SMTP_USER=resend`, `SMTP_PASSWORD=<api key>`, `EMAIL_FROM="Purchase Vault <no-reply@your-domain>"`.
4. **Google sign-in (optional):** create an OAuth client with redirect URI
   `https://<your-domain>/api/auth/callback/google`; set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
5. **App — [Vercel](https://vercel.com):** import the GitHub repo and add the variables above plus
   `AUTH_SECRET` (`npx auth secret`), `APP_URL=https://<your-domain>` and `CRON_SECRET` (any long random string).
   `vercel.json` schedules the daily reminder emails and the 30-day purge; Vercel sends `CRON_SECRET` with them.

## License
MIT — see [`LICENSE`](LICENSE). Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md).
