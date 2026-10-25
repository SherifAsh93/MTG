/** Assistant functional checks against a candidate base URL.
 * Synthetic client fixture only (created then deleted); no owner CMS content changes —
 * the content test re-saves one value to the identical value it already has. */
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "/home/sherif/sites/Ahmed-Elakad/.env.local", quiet: true });
const base = process.argv[2] || "http://127.0.0.1:3003";
const sql = neon(process.env.DATABASE_URL);

const version = (await sql`select data->'sessionVersion' as version from site_content where id='admin-config'`)[0]?.version;
const key = createHmac("sha256", "ahmed-elakad/admin-session").update(process.env.SESSION_SECRET || process.env.DATABASE_URL).digest();
const payload = `aea1.${Math.floor(Date.now() / 1000) + 1200}.${typeof version === "number" ? version : 0}.${randomBytes(16).toString("base64url")}`;
const token = payload + "." + createHmac("sha256", key).update(payload).digest("base64url");
const cookie = `admin_session=${token}`;

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// idempotent cleanup: remove any leftover fixture from a previous aborted run
await sql`delete from clients where data->>'name' = 'ASSISTTEST QA'`;
const baseline = (await sql`select count(*)::int as n from clients`)[0].n;
assert.equal(baseline, 66, `expected 66 clients at baseline, got ${baseline}`);
async function askOnce(text) {
  await sleep(8000);
  const r = await fetch(base + "/api/admin/assistant", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
  });
  if (!r.ok) throw new Error(`assistant HTTP ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const j = await r.json();
  if (typeof j.reply === "string" && j.reply.includes("limit reached")) {
    // A limit reply can still carry tools that already executed — never re-send those.
    if ((j.tools?.length ?? 0) > 0) return j;
    await sleep(70000);
    const r2 = await fetch(base + "/api/admin/assistant", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
    });
    if (!r2.ok) throw new Error(`assistant HTTP ${r2.status} after limit wait`);
    return r2.json();
  }
  return j;
}
async function ask(text, expectedTools) {
  let last = await askOnce(text);
  if (expectedTools) {
    for (let i = 0; i < 2 && !last.tools?.some((t) => t.ok && expectedTools.includes(t.name)); i++) {
      last = await askOnce(text + " Do not ask questions — execute it directly with your tools now.");
    }
  }
  return last;
}
const contentSnapshot = async () => JSON.stringify(await sql`select id, data from site_content order by id`);
const clientRows = async (name) => (await sql`select id, data from clients where data->>'name' = ${name}`);

// 1. auth gate
const noAuth = await fetch(base + "/api/admin/assistant", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
});
assert.equal(noAuth.status, 401);
results.push("unauthenticated request rejected 401");

// 2. read-only task + no content drift
const contentBefore = await contentSnapshot();
const r1 = await ask("How many clients are in the CRM right now? Reply with only the number.");
assert.ok(typeof r1.reply === "string" && r1.reply.length > 0, "empty reply");
assert.ok(Array.isArray(r1.tools) && r1.tools.length > 0, "no tools used for read task");
assert.ok(r1.tools.some((t) => t.ok && ["list_clients", "admin_overview", "get_client"].includes(t.name)), "no successful client-count tool: " + JSON.stringify(r1.tools));
const digits = r1.reply.replace(/[^0-9]/g, "");
assert.ok(digits.includes("66"), `reply should contain 66, got: ${r1.reply}`);
assert.equal(await contentSnapshot(), contentBefore, "site content changed during read-only task");
results.push(`read task: clients=66 reported, ${r1.tools.length} tool(s) verified, content untouched`);

// 3. synthetic client create
const r2 = await ask('Create a client with name "ASSISTTEST QA", phone "01099887766", notes "assistant QA fixture", status pending.', ["create_client"]);
assert.ok(r2.tools.some((t) => t.ok && t.name === "create_client"), "create_client not successful: " + JSON.stringify(r2.tools));
const created = await clientRows("ASSISTTEST QA");
assert.equal(created.length, 1, "fixture client not found after create");
const fixtureId = created[0].id;
results.push(`create_client: fixture row exists (id=${fixtureId})`);

// 4. fixture update via client_action
const r3 = await ask('Add a payment of 1 EGP with note "assistant QA" and date today to the client named ASSISTTEST QA.', ["client_action", "update_client"]);
assert.ok(r3.tools.some((t) => t.ok && ["client_action", "update_client"].includes(t.name)), "payment add not successful: " + JSON.stringify(r3.tools));
const paid = await sql`select data->'payments' as payments from clients where id = ${fixtureId}`;
assert.equal(JSON.parse(JSON.stringify(paid[0].payments)).length, 1, "payment not persisted");
results.push("client_action addPayment: 1 payment persisted");

// 5. identical content round-trip (re-save one scalar to the identical value on the 'site' singleton)
const preType = (await sql`select jsonb_typeof(data) as t from site_content where id = 'site'`)[0].t;
assert.equal(preType, "object", "site content must be an object before the round-trip test");
const rows = await sql`select id, data from site_content where id = 'site'`;
assert.equal(rows.length, 1, "site content singleton not found");
let path = null, value = null;
const walk = (obj, prefix) => {
  if (path) return;
  if (typeof obj === "string" && obj.length > 0 && obj.length < 120) { path = prefix; value = obj; return; }
  if (obj && typeof obj === "object") for (const k of Object.keys(obj)) walk(obj[k], prefix ? `${prefix}.${k}` : k);
};
walk(rows[0].data, "");
assert.ok(path, "no scalar content path found for round-trip test");
const r4 = await ask(`Set the content value at path "${path}" to exactly "${value}" — it is already that value, so nothing should visibly change. Confirm when verified.`, ["set_content_value"]);
assert.ok(r4.tools.some((t) => t.ok && t.name === "set_content_value"), "set_content_value not successful: " + JSON.stringify(r4.tools));
const after = await sql`select data from site_content where id = 'site'`;
const readBack = JSON.parse(JSON.stringify(after[0].data));
const getAt = (obj, p) => p.split(".").reduce((o, k) => o?.[k], obj);
assert.equal(getAt(readBack, path), value, "value changed after identical re-save");
results.push(`content identical round-trip: path "${path}" re-saved and reads back unchanged`);

// 6. delete fixture
const r5 = await ask('Delete the client ASSISTTEST QA permanently.', ["delete_client"]);
assert.ok(r5.tools.some((t) => t.ok && t.name === "delete_client"), "delete_client not successful: " + JSON.stringify(r5.tools));
assert.equal((await clientRows("ASSISTTEST QA")).length, 0, "fixture still present after delete");
const total = (await sql`select count(*)::int as n from clients`)[0].n;
assert.equal(total, 66, `client count should be back to 66, got ${total}`);
results.push("delete_client: fixture removed, clients back to 66");

// 7. content stability: every doc except the round-tripped 'site' scalar must be byte-identical
const docsBefore = JSON.parse(contentBefore);
const docsFinal = JSON.parse(await contentSnapshot());
assert.equal(docsFinal.length, docsBefore.length, "site_content row count drifted");
for (let i = 0; i < docsBefore.length; i++) {
  if (docsBefore[i].id === "site") continue;
  assert.deepEqual(docsFinal[i], docsBefore[i], `doc ${docsBefore[i].id} drifted`);
}
const finalSite = docsFinal.find((d) => d.id === "site");
const finalVal = path.split(".").reduce((o, k) => o?.[k], finalSite.data);
assert.equal(finalVal, value, "round-tripped value drifted by end of suite");
results.push("site_content: all other docs byte-identical, round-tripped value intact");

console.log(JSON.stringify({ ok: true, base, results }, null, 2));
