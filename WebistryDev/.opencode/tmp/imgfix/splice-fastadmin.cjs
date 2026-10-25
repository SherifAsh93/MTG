const fs = require("fs");
const path = "/home/sherif/sites/Ahmed-Elakad/HANDOFF.md";
const section = fs.readFileSync("/home/sherif/ahmed-fastadmin-20261008/handoff-fastadmin.md", "utf8");
const doc = fs.readFileSync(path, "utf8");
const anchor = "## Upload/dashboard slowness fix — 8 October 2026 (current release)";
if (!doc.includes(anchor)) { console.error("anchor missing"); process.exit(1); }
const updated = doc
  .replace(anchor, section + "\n" + anchor.replace(" (current release)", " (superseded by 20261008-fastadmin)"))
  .replace(/^# Ahmed Elakad — Session Handoff Notes\n\n/, "# Ahmed Elakad — Session Handoff Notes\n\n");
fs.writeFileSync(path, updated);
console.log("spliced ok, bytes", updated.length);
