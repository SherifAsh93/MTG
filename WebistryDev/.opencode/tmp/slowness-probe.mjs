/** Read-only slowness diagnosis: timings for live admin/public endpoints + DB read timing. */
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = process.argv[2] || "https://ahmedelakad.com";
const sql = neon(process.env.DATABASE_URL);

const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");
const cookie = `admin_session=${token}`;

async function timed(label, url, headers = {}) {
  const t = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const r = await fetch(url, { headers, redirect: "manual" });
    await r.arrayBuffer();
    t.push(Math.round(performance.now() - t0));
    if (i < 2) await new Promise((r2) => setTimeout(r2, 500));
  }
  return { label, ms: t };
}
const results = [];
results.push(await timed("GET / (public)", base + "/"));
results.push(await timed("GET /api/content (401KB json)", base + "/api/content"));
results.push(await timed("GET /admin/dashboard (cookie)", base + "/admin/dashboard", { cookie }));
results.push(await timed("GET /admin/login", base + "/admin/login"));
results.push(await timed("GET /api/health", base + "/api/health"));

// DB timing: full content read (what every dashboard render does)
const db = [];
for (let i = 0; i < 5; i++) {
  const t0 = performance.now();
  const r = await sql`select data from site_content where id = 'site'`;
  db.push({ ms: Math.round(performance.now() - t0), bytes: JSON.stringify(r[0].data).length });
  await new Promise((r2) => setTimeout(r2, 300));
}
const clients = [];
for (let i = 0; i < 3; i++) {
  const t0 = performance.now();
  const r = await sql`select data from clients`;
  clients.push({ ms: Math.round(performance.now() - t0), rows: r.length });
}
console.log(JSON.stringify({ endpoints: results, dbSiteContentRead: db, dbClientsRead: clients }, null, 1));
