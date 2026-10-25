/** Verify fastadmin: confirmation bubble UI (mocked), real assistant round-trip, SWR cache, shots, content safety. */
import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { chromium } from "playwright";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = "https://ahmedelakad.com";
const evidence = "/home/sherif/ahmed-fastadmin-20261008";
const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 3600}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const contentBefore = (await sql`select md5(data::text) as m, length(data::text) as l from site_content where id='site'`)[0];
const analyticsBefore = (await sql`select count(*)::int as c from analytics_months`)[0].c;
const MOCK_CONFIRMATION = "✅ تم الإنجاز — Actions completed (1/1 verified):\n• saved analytics month — mock-month — ✓ verified";

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const result = { analyticsBefore, contentUnchanged: null, errors: [] };

async function openPanel(page) {
  await page.goto(base + "/admin/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.locator('button[aria-label="Open assistant"]').click({ timeout: 15000 });
}

async function readCache(page) {
  return page.evaluate(() => {
    const raw = sessionStorage.getItem("aea-images-cache-v1");
    if (!raw) return { present: false };
    try {
      const j = JSON.parse(raw);
      return { present: true, images: Array.isArray(j.images) ? j.images.length : -1 };
    } catch { return { present: false, parseError: true }; }
  });
}

async function runMocked(viewport, label) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: true }]);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  await page.route("**/api/admin/assistant", (route) =>
    route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({
        reply: "تم إنشاء الشهر التجريبي.",
        tools: [{ name: "save_analytics_month", ok: true, detail: "mock-month" }],
        confirmation: MOCK_CONFIRMATION,
      }),
    })
  );
  await openPanel(page);
  const cache1 = await readCache(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const cache2 = await readCache(page);
  await openPanel(page).catch(() => page.locator('button[aria-label="Open assistant"]').click());
  await page.locator('textarea[placeholder^="Write what you want"]').fill("اختبار الواجهة");
  await page.locator('button[aria-label="Send"]').click();
  await page.waitForSelector('text=/تم الإنجاز|Actions completed|Partial actions/', { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${evidence}/confirm-${label}.png` });
  const out = { label, cache1, cache2, mockBubbleShown: true, pageErrors };
  await ctx.close();
  return out;
}

async function runReal(viewport, label) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addCookies([{ name: "admin_session", value: token, url: base, httpOnly: true, sameSite: "Lax", secure: true }]);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  let assistantBody = null;
  page.on("response", async (r) => {
    if (r.url().includes("/api/admin/assistant") && r.request().method() === "POST") {
      try { assistantBody = { status: r.status(), body: await r.json() }; } catch { assistantBody = { status: r.status() }; }
    }
  });
  await openPanel(page);
  const msg = 'أنشئ شهر تحليلات تجريبي باسم "assistant-fasttest" بمنشورات فارغة ثم احذفه فوراً، وأخبرني بالنتيجة.';
  await page.locator('textarea[placeholder^="Write what you want"]').fill(msg);
  await page.locator('button[aria-label="Send"]').click();
  let bubbleShown = false;
  try {
    await page.waitForSelector('text=/تم الإنجاز|Actions completed|Partial actions/', { timeout: 120000 });
    bubbleShown = true;
  } catch {}
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${evidence}/real-${label}.png` });
  const panelText = await page.locator('button[aria-label="Open assistant"], div').filter({ hasText: "ASSISTANT" }).first().innerText().catch(() => "(panel text unavailable)");
  const out = {
    label, bubbleShown,
    assistantStatus: assistantBody?.status,
    assistantReply: assistantBody?.body?.reply?.slice(0, 200),
    hasConfirmationField: typeof assistantBody?.body?.confirmation === "string",
    limited: assistantBody?.body?.limited ?? false,
    tools: (assistantBody?.body?.tools ?? []).map((t) => `${t.name}:${t.ok ? "ok" : "fail"}`),
    panelTextExcerpt: panelText.slice(0, 600),
    pageErrors,
  };
  await ctx.close();
  return out;
}

try {
  result.mocked = await runMocked({ width: 1440, height: 900 }, "desktop");
  result.mockedMobile = await runMocked({ width: 390, height: 844 }, "mobile");
  result.real = await runReal({ width: 1440, height: 900 }, "desktop");
} finally {
  await browser.close();
}

const analyticsAfter = (await sql`select count(*)::int as c from analytics_months`)[0].c;
const contentAfter = (await sql`select md5(data::text) as m, length(data::text) as l from site_content where id='site'`)[0];
result.analyticsAfter = analyticsAfter;
result.contentUnchanged = contentBefore.m === contentAfter.m && contentBefore.l === contentAfter.l;
result.pass = Boolean(
  result.mocked?.mockBubbleShown && result.mockedMobile?.mockBubbleShown &&
  result.mocked?.cache1.present && result.mocked?.cache1.images > 0 && result.mocked?.cache2.present &&
  result.real?.bubbleShown && analyticsAfter === analyticsBefore && result.contentUnchanged &&
  (result.mocked?.pageErrors ?? []).length === 0 && (result.real?.pageErrors ?? []).length === 0
);
fs.writeFileSync(`${evidence}/verify-fastadmin.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
