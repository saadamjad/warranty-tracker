// Two devices, one account: backup, restore with files, edits both ways, delete forever (FR-28/29, D-17, D-29).
import { BASE, assert, backupStatus, checklist, drawReceipt, launch, signIn, uploadImage } from "./helpers.mjs";

const browser = await launch();
const email = `sync-${Date.now()}@example.com`;
const { check, report } = checklist();
const device = async () => (await browser.newContext()).newPage();
const [a, b] = [await device(), await device()];
let purchaseId;

await check("guest", "Device A saves a purchase with a photo, no account", async () => {
  await a.goto(`${BASE}/add`);
  await a.getByRole("button", { name: "Enter details myself" }).click();
  await a.waitForURL("**/p?id=*");
  purchaseId = new URL(a.url()).searchParams.get("id");
  await a.getByLabel("Product").fill("Dyson V8");
  await a.getByLabel("Product").blur();
  await a.getByRole("link", { name: "+ Add document" }).click();
  await uploadImage(a, "receipt.png", await drawReceipt(a, ["CURRYS", "TOTAL 249.00"], 500));
  await a.getByRole("button", { name: "Add to purchase" }).click();
  await a.waitForURL("**/p?id=*");
  await backupStatus(a, "Saved on this device").waitFor();
});

await check("backup", "Signing in on A backs everything up", async () => {
  await signIn(a, email);
  await backupStatus(a, "Backed up").waitFor({ timeout: 60_000 });
});

await check("restore", "Signing in on B restores the purchase and its photo", async () => {
  await signIn(b, email);
  await backupStatus(b, "Backed up").waitFor({ timeout: 60_000 });
  await b.goto(`${BASE}/p?id=${purchaseId}`);
  await b.getByRole("button", { name: /^View / }).click();
  const image = b.getByRole("img", { name: "Page 1" });
  await image.waitFor({ timeout: 20_000 });
  assert(await image.evaluate((element) => element.complete && element.naturalWidth > 0), "restored image does not render");
});

await check("edit", "An edit on B reaches A", async () => {
  await b.getByLabel("Serial number").fill("SN-123");
  await b.getByLabel("Serial number").blur();
  await b.waitForTimeout(500);
  await backupStatus(b, "Backed up").waitFor({ timeout: 30_000 });
  for (let attempt = 0; attempt < 10; attempt++) {
    await a.goto(`${BASE}/p?id=${purchaseId}`);
    await a.waitForTimeout(2_000);
    await a.reload();
    if ((await a.getByLabel("Serial number").inputValue()) === "SN-123") return;
  }
  throw new Error("A never received the serial number");
});

await check("purge", "Delete forever on A removes it from B", async () => {
  await a.getByRole("button", { name: "Delete purchase" }).click();
  await a.getByRole("button", { name: "Delete", exact: true }).click();
  await a.waitForURL(`${BASE}/`);
  await a.goto(`${BASE}/settings/deleted`);
  await a.getByRole("button", { name: "Delete forever…" }).click();
  await a.getByRole("button", { name: "Delete forever", exact: true }).click();
  await a.getByText(/Nothing here/).waitFor();
  for (let attempt = 0; attempt < 10; attempt++) {
    await a.waitForTimeout(2_000);
    await b.goto(BASE);
    await b.waitForTimeout(2_000);
    await b.reload();
    await b.waitForTimeout(500);
    if (!(await b.getByRole("link", { name: /Dyson V8/ }).count())) return;
  }
  throw new Error("B still lists the purchase");
});

await browser.close();
report();
