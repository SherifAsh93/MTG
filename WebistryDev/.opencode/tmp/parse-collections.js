const fs = require("fs");
const raw = fs.readFileSync("/tmp/collections_raw.txt", "utf8").trim();
const data = JSON.parse(raw);
console.log("top-level type:", Array.isArray(data) ? "array" : typeof data, "| length:", data.length);
for (const c of data) {
  console.log(`\n== ${c.slug} :: "${c.title}" | albums=${(c.albums||[]).length}`);
  for (const a of c.albums || []) {
    console.log(`   - ${a.slug} :: "${a.title}" | images=${(a.images||[]).length}`);
  }
}
