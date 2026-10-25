/** Surgical recovery: restore only site_content.id='site' from the latest pre-corruption snapshot.
 * Corrupted current value is archived to the evidence folder first. No other row is touched.
 * Uses the PG18 pg_restore client to extract COPY text (local cluster is PG16 and cannot read v1.16 dumps). */
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import dotenv from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";
import { decryptBackup } from "./backup-crypto.mjs";

const root = "/home/sherif/sites/Ahmed-Elakad";
const evidence = "/home/sherif/ahmed-assistant-20261008";
const aeb = "/home/sherif/backups/ahmed-elakad-recovery/2026-10-07T18-17-03-467Z-44ed0785-0f77-43ff-aed5-1d60dc6ffd18.aeb";
const tmp = "/home/sherif/restore-tmp";
const pgRestore = "/usr/lib/postgresql/18/bin/pg_restore";
dotenv.config({ path: root + "/.env.local", quiet: true });
neonConfig.webSocketConstructor = globalThis.WebSocket;
const sha = (b) => createHash("sha256").update(b).digest("hex");
await fs.mkdir(evidence, { recursive: true, mode: 0o700 });
await fs.mkdir(tmp, { recursive: true, mode: 0o700 });

function unescapeCopy(v) {
  return v.replace(/\\([\\nrtbf0])/g, (_, c) => ({ "\\": "\\", n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", 0: "\0" })[c]);
}
function extractSiteRow(copyText) {
  const lines = copyText.split("\n");
  const headerIdx = lines.findIndex((l) => l.startsWith("COPY ") && l.includes("site_content") && l.endsWith("FROM stdin;"));
  if (headerIdx < 0) throw new Error("COPY block for site_content not found");
  const cols = lines[headerIdx].replace(/^COPY\s+\S+\s*\(([^)]*)\)\s+FROM stdin;$/, "$1").split(",").map((s) => s.trim());
  const idIdx = cols.indexOf("id");
  const dataIdx = cols.indexOf("data");
  if (idIdx < 0 || dataIdx < 0) throw new Error("id/data columns not found in COPY header: " + cols.join(","));
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i] === "\\.") break;
    const fields = lines[i].split("\t");
    if (unescapeCopy(fields[idIdx] ?? "") === "site") return unescapeCopy(fields[dataIdx]);
  }
  throw new Error("site row not found in COPY block");
}

const sql = neon(process.env.DATABASE_URL);
const current = (await sql`select data, updated_at from site_content where id = 'site'`)[0];
await fs.writeFile(evidence + "/site-content-CORRUPTED-before-restore.json",
  JSON.stringify({ updatedAt: current.updated_at, data: current.data }, null, 2), { mode: 0o600 });
console.log("corrupted value archived:", JSON.stringify(current.data).slice(0, 80));

const key = await fs.readFile("/home/sherif/.config/ahmed-backup/key-v1.bin");
const doc = JSON.parse(decryptBackup(await fs.readFile(aeb), key).toString());
if (sha(Buffer.from(doc.dump, "base64")) !== doc.dumpSha256) throw new Error("snapshot dump digest mismatch");
const dumpPath = tmp + "/snapshot.dump";
await fs.writeFile(dumpPath, Buffer.from(doc.dump, "base64"), { mode: 0o600 });
console.log("snapshot decrypted:", doc.createdAt, "tables:", doc.tables.length);

const r = spawnSync(pgRestore, ["--data-only", "-t", "site_content", "-f", tmp + "/site-copy.sql", dumpPath],
  { encoding: "utf8", maxBuffer: 64 * 1024 ** 2 });
if (r.status !== 0) throw new Error("pg_restore extract failed: " + (r.stderr || "").slice(0, 500));
const restoredText = extractSiteRow(await fs.readFile(tmp + "/site-copy.sql", "utf8"));
const restored = JSON.parse(restoredText);
if (!restored || typeof restored !== "object" || Array.isArray(restored)) throw new Error("snapshot site row is not an object");
const keyCount = Object.keys(restored).length;
if (keyCount < 3) throw new Error("snapshot site row suspiciously small: keys=" + keyCount);
const refScan = (restoredText.match(/\/images\//g) || []).length;
await fs.writeFile(tmp + "/site-content-restored.json", restoredText, { mode: 0o600 });
console.log("restored keys:", keyCount, "bytes:", restoredText.length, "/images/ refs:", refScan);

await sql`update site_content set data = ${restoredText}::jsonb, updated_at = now() where id = 'site'`;
const verify = (await sql`select data from site_content where id = 'site'`)[0].data;
if (sha(JSON.stringify(verify)) !== sha(JSON.stringify(restored))) throw new Error("post-restore readback mismatch");
const clients = (await sql`select count(*)::int as n from clients`)[0].n;
const others = await sql`select id, updated_at from site_content where id != 'site' order by id`;
console.log(JSON.stringify({ ok: true, keys: keyCount, bytes: restoredText.length, imageRefs: refScan, clients, readback: "identical", untouchedRows: others }, null, 1));
