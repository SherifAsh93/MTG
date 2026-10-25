/** Verify the imagesfix: upload e2e (no full-list refetch), thumbnail in response, mobile+desktop shots. */
import { createHmac, randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { chromium } from "playwright";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = "https://ahmedelakad.com";
const evidence = "/home/sherif/ahmed-imagesfix-20261008";
const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const fixture = evidence + "/synthetic-imagesfix-test.jpg";
await sharp({ create: { width: 640, height: 900, channels: 3, background: { r: 40, g: 90, b: 160 } }, noise: { type: "gaussian", mean: 12, sigma: 4 } }).jpeg({ quality: 85 }).toFile(fixture);

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: true }]);
const page = await ctx.newPage();
const imagesRequests = { before: 0, during: 0 };
let phase = "before";
page.on("request", (r) => {
  if (r.url().includes("/api/images")) imagesRequests[phase]++;
});
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

await page.goto(base + "/admin/dashboard", { waitUntil: "load", timeout: 60000 });
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
await page.locator("button, a").filter({ hasText: "MEDIA LIBRARY" }).first().click({ timeout: 15000 });
await page.locator("input#picker-upload").waitFor({ state: "attached", timeout: 15000 });

const putPromise = page.waitForResponse((r) => r.url().includes("/api/upload/local") && r.request().method() === "PUT", { timeout: 90000 });
phase = "during";
const t0 = Date.now();
await page.locator("input#picker-upload").setInputFiles(fixture);
const putRes = await putPromise;
const uploadMs = Date.now() - t0;
const putBody = await putRes.json().catch(() => ({}));
await page.waitForTimeout(1500);
phase = "before";

const ok = putRes.status() === 200 && typeof putBody.url === "string" && putBody.thumbnail === putBody.url + "?w=400";
const idMatch = (putBody.url || "").match(/\/api\/media\/([a-f0-9-]+)/);
await page.screenshot({ path: evidence + "/ui-1440x900.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
await page.screenshot({ path: evidence + "/ui-390x844.png" });
await browser.close();

const report = {
  uploadMs, status: putRes.status(), ok,
  url: putBody.url, thumbnail: putBody.thumbnail, backup: putBody.backup,
  imagesRequestsDuringUpload: imagesRequests.during,
  imagesRequestsInitial: imagesRequests.before,
  pageErrors: pageErrors.length, fixtureSha256: createHash("sha256").update(fs.readFileSync(fixture)).digest("hex"),
  fixtureBytes: fs.statSync(fixture).size,
};
console.log(JSON.stringify(report, null, 1));
if (!ok || imagesRequests.during !== 0 || pageErrors.length) { console.error("VERIFY-FAILED"); process.exitCode = 1; }
