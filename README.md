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
docker compose up -d             # MariaDB on 3307 (documents are saved in .storage/)
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

## Deploy on Hostinger Business (no other services needed)
Everything runs on one Hostinger Business plan (SPEC D-38): the app, its MySQL database, the stored
documents and the email. Every push to `main` redeploys.
1. **Database:** hPanel → **Databases → MySQL Databases**, create a database and user. Then
   `DATABASE_URL=mysql://<user>:<password>@localhost:3306/<database>` (use the host hPanel shows if
   `localhost` doesn't connect). Each deploy applies new migrations before the new code goes live.
2. **Email:** hPanel → **Emails**, create a mailbox (for example `no-reply@<your-domain>`). Then
   `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=587`, `SMTP_USER=<mailbox>`, `SMTP_PASSWORD=<mailbox password>`,
   `EMAIL_FROM="Purchase Vault <mailbox>"`.
3. **Files:** pick a folder in your home directory but **outside** the app's folder, for example
   `STORAGE_DIR=/home/<user>/vault-files`. A redeploy replaces the app folder, so files kept inside it would be
   lost. The app creates the folder on the first upload and refuses to start with a relative path.
4. **App:** hPanel → **Websites → Add website → Node.js web app → Import Git repository**, authorize GitHub,
   pick this repo and branch `main`. Node **22**, install `npm install`, build `npm run build:live`, start `npm start`.
5. **Environment variables:** the values above plus `APP_ENV=production`, `APP_URL=https://<your-domain>`,
   `AUTH_SECRET` (`npx auth secret`) and `CRON_SECRET` (any random string of 32+ characters).
   The app refuses to start on the live site if one of these is missing or unsafe.
6. **Domain:** point the domain at the app and turn on SSL in hPanel.
7. **Daily jobs:** GitHub → **Settings → Secrets and variables → Actions**, add `APP_URL` and `CRON_SECRET`
   (same values). `.github/workflows/daily-jobs.yml` then runs the reminder emails and the 30-day purge every day.
   GitHub pauses scheduled workflows after 60 days without a commit; re-enable it under **Actions** if so.
8. **Google sign-in (optional):** create an OAuth client with redirect URI
   `https://<your-domain>/api/auth/callback/google`; set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

Backups: the database and `STORAGE_DIR` together are the whole backup. Check that your Hostinger backups
cover both, since documents are not in the database.

## License
MIT — see [`LICENSE`](LICENSE). Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md).
