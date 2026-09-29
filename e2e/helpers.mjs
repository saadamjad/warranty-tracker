// Shared helpers for the browser checks (SPEC D-36). They drive the installed Chrome against a
// running production build: `npm run build && npx next start -p 3100 > /tmp/vault-e2e.log`.
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
/** Where the server's output goes, to pick up dev sign-in links (no SMTP locally). */
export const SERVER_LOG = process.env.E2E_SERVER_LOG ?? "/tmp/vault-e2e.log";

export function launch() {
  return chromium.launch({ channel: "chrome", headless: true });
}

/** Runs named checks, prints PASS/FAIL lines, and sets the exit code. */
export function checklist() {
  const results = [];
  return {
    async check(id, name, fn) {
      try {
        await fn();
        results.push(["PASS", id, name]);
      } catch (error) {
        results.push(["FAIL", id, `${name} — ${error.message.split("\n")[0]}`]);
      }
    },
    report() {
      for (const [verdict, id, name] of results) console.log(`${verdict}  ${id.padEnd(8)} ${name}`);
      if (results.some(([verdict]) => verdict === "FAIL")) process.exitCode = 1;
    },
  };
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** A receipt-like PNG drawn in the page, as base64. */
export function drawReceipt(page, lines, width = 900) {
  return page.evaluate(
    ([text, w]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = 140 + text.length * 110;
      const g = canvas.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.fillStyle = "#000";
      g.font = "42px monospace";
      text.forEach((line, i) => g.fillText(line, 50, 110 + i * 110));
      return canvas.toDataURL("image/png").split(",")[1];
    },
    [lines, width],
  );
}

export function uploadImage(page, name, base64, input = "input[type=file][multiple]") {
  return page.setInputFiles(input, { name, mimeType: "image/png", buffer: Buffer.from(base64, "base64") });
}

/** The backup status chip, matched exactly (its icon is ignored). */
export function backupStatus(page, text) {
  return page.getByRole("status").filter({ hasText: new RegExp(`^\\W?${text}$`) }).first();
}

/** Signs in with an email link, taken from the server output. */
export async function signIn(page, email) {
  await page.goto(`${BASE}/signin`);
  await page.getByLabel("Email").fill(email);
  const logStart = readFileSync(SERVER_LOG, "utf8").length;
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.waitForURL("**/signin/sent**");
  let link;
  for (let attempt = 0; attempt < 20 && !link; attempt++) {
    await page.waitForTimeout(250);
    link = readFileSync(SERVER_LOG, "utf8").slice(logStart).match(/https?:\/\/\S+\/api\/auth\/callback\/nodemailer\S+/)?.[0];
  }
  assert(link, `no sign-in link in ${SERVER_LOG}`);
  await page.goto(link);
  await page.waitForURL("**/settings**");
}
