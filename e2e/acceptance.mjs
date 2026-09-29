// SPEC §9 acceptance scenarios AC-1..AC-20 in a real browser at phone width.
import { BASE, assert, backupStatus, checklist, drawReceipt, launch, signIn, uploadImage } from "./helpers.mjs";

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on("pageerror", (error) => console.log("page error:", error.message));
const { check, report } = checklist();
const purchaseIdFromUrl = () => new URL(page.url()).searchParams.get("id");

await page.goto(BASE);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();

let kettleId;
await check("AC-1/2", "Save without an account: capture → review → fix a field → save", async () => {
  await page.getByRole("link", { name: "+ Add Purchase" }).click();
  await uploadImage(page, "r.png", await drawReceipt(page, ["METRO CASH & CARRY", "Bill Date: 04/05/2026", "Philips Kettle", "TOTAL PKR 4,500.00"]));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "We found these details" }).waitFor({ timeout: 90_000 });
  assert((await page.getByText("Please check").count()) > 0, "uncertain fields not highlighted");
  await page.getByRole("button", { name: "4 May 2026" }).click();
  await page.locator("#review-productName").fill("Philips Kettle");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/p?id=*");
  kettleId = purchaseIdFromUrl();
  assert((await page.getByLabel("Store").inputValue()) === "Metro Cash & Carry", "store not saved");
});

await check("AC-3", "Save with fields missing", async () => {
  await page.goto(`${BASE}/add`);
  await page.getByRole("button", { name: "Enter details myself" }).click();
  await page.waitForURL("**/p?id=*");
  await page.goto(BASE);
  await page.getByRole("link", { name: /Untitled purchase/ }).first().waitFor();
});

await check("AC-4/5", "Attach a warranty card to an existing purchase; documents shown together", async () => {
  await page.goto(`${BASE}/p?id=${kettleId}`);
  await page.getByRole("link", { name: "+ Add document" }).click();
  await uploadImage(page, "w.png", await drawReceipt(page, ["WARRANTY CARD", "2 years warranty"]));
  await page.getByRole("button", { name: "Add to purchase" }).click();
  await page.waitForURL("**/p?id=*");
  await page.getByRole("button", { name: /View receipt/ }).waitFor();
  await page.getByRole("button", { name: /View warranty card/ }).waitFor();
});

await check("AC-6/7", "Find by partial product name and by store", async () => {
  for (const query of ["kett", "metr"]) {
    await page.goto(`${BASE}/search?q=${query}`);
    await page.getByRole("link", { name: /Philips Kettle/ }).first().waitFor();
  }
});

await check("AC-8", "Edit after save", async () => {
  await page.goto(`${BASE}/p?id=${kettleId}`);
  await page.getByLabel("Model").fill("HD9350");
  await page.getByLabel("Model").blur();
  await page.reload();
  assert((await page.getByLabel("Model").inputValue()) === "HD9350", "edit lost");
});

await check("AC-9/10", "Warranty active / expiring / expired, and a reminder before expiry", async () => {
  await page.goto(`${BASE}/p?id=${kettleId}`);
  await page.getByRole("button", { name: "+ Add warranty" }).click();
  const ends = page.getByLabel("Ends");
  const soon = new Date(Date.now() + 12 * 864e5).toISOString().slice(0, 10);
  for (const [date, badge] of [[soon, /Warranty ends in \d+ days/], ["2020-01-01", /Warranty expired/], ["2030-01-01", /Under warranty/], [soon, /Warranty ends in/]]) {
    await ends.fill(date);
    await ends.blur();
    await page.getByText(badge).waitFor();
  }
  await page.goto(BASE);
  await page.getByText(/Philips Kettle — Warranty ends in/).waitFor();
});

await check("AC-11", "Browse and create offline (EC-21)", async () => {
  await context.setOffline(true);
  await page.goto(BASE);
  await page.getByRole("link", { name: /Philips Kettle/ }).first().click();
  await page.waitForURL("**/p?id=*");
  await page.goto(`${BASE}/add`);
  await page.getByRole("button", { name: "Enter details myself" }).click();
  await page.waitForURL("**/p?id=*");
  await page.getByLabel("Product").fill("Offline purchase");
  await page.getByLabel("Product").blur();
  await page.goto(BASE);
  await page.getByRole("link", { name: /Offline purchase/ }).waitFor();
});
await context.setOffline(false);

await check("AC-12/13", "Made offline, backed up later; local vs backed-up state visible", async () => {
  await page.goto(BASE);
  await backupStatus(page, "Saved on this device").waitFor();
  await signIn(page, `acceptance-${Date.now()}@example.com`);
  await backupStatus(page, "Backed up").waitFor({ timeout: 60_000 });
});

await check("AC-14/15", "An unreadable photo is not a dead end", async () => {
  await page.goto(`${BASE}/add`);
  await uploadImage(page, "blur.png", await drawReceipt(page, ["~~~ ~~ ~"], 300));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: /We found these details|Add the details you know/ }).waitFor({ timeout: 90_000 });
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/p?id=*");
});

const screenshot = ["Order Number: 190234881203", "Total: Rs. 3,499"];
await check("AC-16", "Save a screenshot", async () => {
  await page.goto(`${BASE}/add`);
  await uploadImage(page, "Screenshot.png", await drawReceipt(page, screenshot));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "We found these details" }).waitFor({ timeout: 90_000 });
  assert((await page.locator("#review-reference").inputValue()) === "190234881203", "order number not read");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/p?id=*");
});

await check("AC-17", "Duplicate warning never deletes", async () => {
  await page.goto(`${BASE}/add`);
  await uploadImage(page, "again.png", await drawReceipt(page, screenshot));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "You've saved this file before" }).waitFor();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.goto(`${BASE}/search?q=190234881203`);
  await page.getByRole("link").filter({ hasText: "Invoice or order number" }).first().waitFor();
});

await check("AC-18", "Delete, understand what happens to documents, restore", async () => {
  await page.goto(`${BASE}/p?id=${kettleId}`);
  await page.getByRole("button", { name: "Delete purchase" }).click();
  await page
    .getByRole("alertdialog")
    .filter({ hasText: "This removes the purchase and its 2 documents. You can restore it from Recently Deleted for 30 days." })
    .waitFor();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/settings/deleted`);
  await page.getByRole("button", { name: "Restore" }).click();
  await page.getByText(/Nothing here/).waitFor();
  await page.goto(BASE);
  await page.getByRole("link", { name: /Philips Kettle/ }).first().waitFor();
});

await check("AC-19", "Export", async () => {
  await page.goto(`${BASE}/settings`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download all my purchases" }).click();
  assert(/^purchase-vault-\d{4}-\d{2}-\d{2}\.zip$/.test((await download).suggestedFilename()), "unexpected file name");
});

await check("AC-20", "Privacy promise understandable without technical docs", async () => {
  await page.goto(BASE);
  await page.getByRole("link", { name: "Privacy" }).click();
  for (const question of ["Where are my purchases kept?", "Who can see them?", "Is my original photo or file kept?", "What does delete mean?", "What if I lose my phone?", "What if it reads something wrong?"]) {
    await page.getByRole("heading", { name: question }).waitFor();
  }
  const text = await page.locator("main").innerText();
  for (const word of ["OCR", "AI ", "database", "sync"]) assert(!text.includes(word), `technical word on page: ${word}`);
});

await browser.close();
report();
