/** Assistant UI verification: real browser, mobile+desktop viewports, exercised interaction. */
import fs from "node:fs/promises";
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { chromium } from "playwright";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = process.argv[2] || "http://127.0.0.1:3003";
const outDir = "/home/sherif/ahmed-assistant-20261008";
await fs.mkdir(outDir, { recursive: true, mode: 0o700 });

const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const viewports = [
  { w: 320, h: 740, mobile: true },
  { w: 390, h: 844, mobile: true },
  { w: 1440, h: 900, mobile: false },
];
const results = [];
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mobile, hasTouch: vp.mobile });
  await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: base.startsWith("https:") }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(base + "/admin/dashboard", { waitUntil: "networkidle", timeout: 60000 });
  const fab = page.locator('button[aria-label="Open assistant"]');
  await fab.waitFor({ state: "visible", timeout: 15000 });
  await fab.click();
  await page.waitForTimeout(400);

  const panelVisible = await page.locator('button[aria-label="Close assistant"]').isVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const shot = `${outDir}/ui-${vp.w}x${vp.h}.png`;
  await page.screenshot({ path: shot, fullPage: false });

  let replyShot = null;
  if (vp.w === 390) {
    await page.locator('textarea[placeholder*="Write what you want"]').fill("How many clients are in the CRM? Reply with only the number.");
    await page.locator('button[aria-label="Send"]').click();
    await page.waitForFunction(() => !document.body.textContent.includes("working…"), null, { timeout: 180000 });
    await page.waitForTimeout(600);
    const panelText = await page.evaluate(() => document.querySelector('[class*="rounded-t-2xl"], [class*="rounded-l-2xl"]')?.textContent || "");
    if (!panelText.includes("66")) {
      await page.screenshot({ path: `${outDir}/ui-390x844-reply-FAIL.png`, fullPage: false });
      throw new Error("reply with 66 not visible in UI; panel text: " + panelText.slice(0, 400));
    }
    replyShot = `${outDir}/ui-390x844-reply.png`;
    await page.screenshot({ path: replyShot, fullPage: false });
    results.push(`390x844: sent message through UI, reply shows 66`);
  }

  results.push(`${vp.w}x${vp.h}: panel visible=${panelVisible}, horizontal overflow=${overflow}px, pageErrors=${errors.length}${replyShot ? "" : ""}`);
  if (!panelVisible) throw new Error(`panel not visible at ${vp.w}`);
  if (overflow > 0) throw new Error(`horizontal overflow ${overflow}px at ${vp.w}`);
  if (errors.length) throw new Error(`page errors at ${vp.w}: ${errors.join("; ")}`);
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ ok: true, base, results, outDir }, null, 2));
