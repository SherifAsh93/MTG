/** Direct assistant API probe: run one action round-trip and print the raw result. */
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const sql = neon(process.env.DATABASE_URL);
const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");

const res = await fetch("http://127.0.0.1:3002/api/admin/assistant", {
  method: "POST",
  headers: { "content-type": "application/json", cookie: `admin_session=${token}` },
  body: JSON.stringify({ messages: [{ role: "user", content: 'أنشئ شهر تحليلات تجريبي باسم "assistant-probe" بمنشورات فارغة ثم احذفه فوراً' }] }),
});
console.log("status", res.status);
const body = await res.json();
console.log(JSON.stringify(body, null, 2));
const months = await sql`select count(*)::int as c from analytics_months`;
console.log("analytics_months now:", months[0].c);
