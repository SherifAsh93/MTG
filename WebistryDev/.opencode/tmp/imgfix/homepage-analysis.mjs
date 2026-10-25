/** Read-only public homepage browser analysis: requests, bytes, img attrs, load timing. */
import { chromium } from "playwright";
const base = process.argv[2] || "https://ahmedelakad.com";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
let bytes = 0; const byType = {}; const slow = [];
page.on("response", async (r) => {
  try {
    const t = r.request().timing();
    const buf = await r.body().catch(() => null);
    const n = buf ? buf.length : 0;
    const type = r.request().resourceType();
    byType[type] = byType[type] || { count: 0, bytes: 0 };
    byType[type].count++; byType[type].bytes += n; bytes += n;
    const dur = Math.round(t.responseEnd - t.requestStart);
    if (dur > 400) slow.push({ url: r.url().replace(base, "").slice(0, 90), type, dur, bytes: n });
  } catch {}
});
const t0 = Date.now();
await page.goto(base + "/", { waitUntil: "load", timeout: 90000 });
const loadMs = Date.now() - t0;
const t1 = Date.now();
await page.waitForLoadState("networkidle", { timeout: 90000 }).catch(() => {});
const idleMs = Date.now() - t1;
const imgInfo = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  return {
    total: imgs.length,
    lazy: imgs.filter((i) => i.loading === "lazy").length,
    eager: imgs.filter((i) => i.loading !== "lazy").length,
    withWidth: imgs.filter((i) => (i.currentSrc || i.src).includes("?w=")).length,
    fullSize: imgs.filter((i) => { const s = i.currentSrc || i.src; return s.includes("/api/media/") && !s.includes("w="); }).length,
    sample: imgs.slice(0, 6).map((i) => (i.currentSrc || i.src).replace(location.origin, "").slice(0, 100)),
    naturalZero: imgs.filter((i) => i.naturalWidth === 0).length,
  };
});
const firstViewportImgs = await page.evaluate(() => [...document.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().top < 900).length);
await browser.close();
console.log(JSON.stringify({ loadMs, networkidleMs: idleMs, totalRequests: Object.values(byType).reduce((a, b) => a + b.count, 0), totalBytes: bytes, byType, imgInfo, firstViewportImgs, slowest: slow.sort((a, b) => b.dur - a.dur).slice(0, 10) }, null, 1));
