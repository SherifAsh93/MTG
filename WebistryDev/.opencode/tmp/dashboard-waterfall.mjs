/** Read-only: dashboard load waterfall (top slow requests) + section interaction timing. */
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { chromium } from "playwright";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = process.argv[2] || "https://ahmedelakad.com";
const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: base.startsWith("https:") }]);
const page = await ctx.newPage();
const requests = [];
page.on("response", (r) => {
  const t = r.request().timing();
  requests.push({ url: r.url().replace(base, ""), status: r.status(), resource: r.request().resourceType(), ttfb: Math.round(t.responseStart), end: Math.round(t.responseEnd) });
});
const t0 = Date.now();
await page.goto(base + "/admin/dashboard", { waitUntil: "load", timeout: 60000 });
const loadMs = Date.now() - t0;
const t1 = Date.now();
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
const idleMs = Date.now() - t1;

const top = [...requests].sort((a, b) => b.end - a.end).slice(0, 12);
const byType = {};
for (const r of requests) {
  byType[r.resource] = byType[r.resource] || { count: 0, maxEnd: 0, bytes: 0 };
  byType[r.resource].count++;
  byType[r.resource].maxEnd = Math.max(byType[r.resource].maxEnd, r.end);
}
// interaction: navigate to Clients section (read-only client list)
const t2 = Date.now();
const clientsLink = page.locator("text=Clients").first();
await clientsLink.click({ timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1500);
const clientsMs = Date.now() - t2;
const clientShot = "/home/sherif/ahmed-assistant-20261008/waterfall-clients-section.png";
await page.screenshot({ path: clientShot });
await browser.close();
console.log(JSON.stringify({ base, loadMs, networkidleMs: idleMs, requestCount: requests.length, byType, topSlowest: top, clientsSectionClickMs: clientsMs }, null, 1));
