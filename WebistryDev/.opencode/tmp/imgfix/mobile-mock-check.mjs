/** Strict mobile confirmation-bubble check: mock response must render (requires 'mock-month'). */
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { chromium } from "playwright";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = "https://ahmedelakad.com";
const evidence = "/home/sherif/ahmed-fastadmin-20261008";
const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: true }]);
const page = await ctx.newPage();
let intercepted = 0;
let served = null;
await page.route("**/api/admin/assistant*", (route) => {
  intercepted += 1;
  served = "mock";
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      reply: "تم إنشاء الشهر التجريبي.",
      tools: [{ name: "save_analytics_month", ok: true, detail: "mock-month" }],
      confirmation: "✅ تم الإنجاز — Actions completed (1/1 verified):\n• saved analytics month — mock-month — ✓ verified",
    }),
  });
});
await page.goto(base + "/admin/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(3500);
await page.locator('button[aria-label="Open assistant"]').click({ timeout: 15000 });
await page.locator('textarea[placeholder^="Write what you want"]').fill("اختبار");
await page.locator('button[aria-label="Send"]').click();
await page.waitForSelector("text=mock-month", { timeout: 30000 });
await page.waitForTimeout(400);
await page.screenshot({ path: evidence + "/confirm-mobile-strict.png" });
const out = { intercepted, served, mockTextShown: true, viewport: "390x844" };
console.log(JSON.stringify(out));
await browser.close();
process.exit(0);
