const fs = require("node:fs");
const path = "/home/sherif/sites/Ahmed-Elakad/HANDOFF.md";
const section = fs.readFileSync("/home/sherif/ahmed-imagesfix-20261008/handoff-section.md", "utf8");
const doc = fs.readFileSync(path, "utf8");
const anchor = "## Admin AI assistant deployed — 8 October 2026";
if (doc.includes("## Upload/dashboard slowness fix")) { console.log("already present"); process.exit(0); }
if (!doc.includes(anchor)) { console.error("anchor missing"); process.exit(1); }
fs.writeFileSync(path, doc.replace(anchor, section + anchor));
console.log("HANDOFF updated");
