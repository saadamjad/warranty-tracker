// axe-core on every page at phone width, light and dark (CODING_STANDARDS §7), plus no sideways scrolling.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { BASE, checklist, launch } from "./helpers.mjs";

const axe = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const browser = await launch();
const { check, report } = checklist();

for (const colorScheme of ["light", "dark"]) {
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme })).newPage();
  await page.goto(`${BASE}/add`);
  await page.getByRole("button", { name: "Enter details myself" }).click();
  await page.waitForURL("**/p?id=*");
  const purchase = page.url().replace(BASE, "");
  await page.getByLabel("Product").fill("Samsung TV");
  await page.getByLabel("Product").blur();
  await page.getByRole("button", { name: "+ Add warranty" }).click();

  for (const path of ["/", "/add", purchase, "/search?q=sams", "/settings", "/settings/deleted", "/privacy", "/signin"]) {
    await check(colorScheme, path.split("?")[0], async () => {
      await page.goto(BASE + path);
      await page.waitForTimeout(800);
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(async () =>
        (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] })).violations.map((v) => `${v.id}: ${v.help}`),
      );
      if (violations.length) throw new Error(violations.join("; "));
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error("scrolls sideways");
    });
  }
}

await browser.close();
report();
