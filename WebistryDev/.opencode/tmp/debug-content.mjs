import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select id, data from site_content where id = 'site'`;
console.log("rowCount", rows.length);
if (rows[0]) {
  const d = rows[0].data;
  console.log("typeof:", typeof d, "isArray:", Array.isArray(d));
  console.log("preview:", JSON.stringify(d).slice(0, 300));
  if (d && typeof d === "object") console.log("keys:", Object.keys(d).slice(0, 20));
}
const all = await sql`select id from site_content order by id`;
console.log("ids:", JSON.stringify(all));
