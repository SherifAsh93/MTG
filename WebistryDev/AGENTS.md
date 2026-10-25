# WebistryDev — workspace knowledge base (Mode B)

Global rules live in `C:\Users\sheri\.config\opencode\user-preferences.md` and load automatically. Read them first. This file only adds the WebistryDev environment context.

## Where the work actually is

- **No source code lives locally.** `D:\Work\WebistryDev` is a local entry point / scratch area only (moved here on 5 October 2026).
- Authoritative working copies are on the VPS `76.13.42.219` (SSH user `sherif`, RDP `:3389`) under:
  - `/home/sherif/sites/` — active projects (QOYA, Ahmed Elakad, Zahrtelkhlig, WebistryDev portfolio, Leads Management, …)
  - `/home/sherif/workspaces/WebistryDev` — migrated PC workspace (16 project folders + Git history)
  - `/home/sherif/PROJECTS-VPS.md` — **read this first** for the working-directory map and version differences.
- Connection: reuse the saved skill `webistrydev-vps` (`C:\Users\sheri\.config\opencode\skills\webistrydev-vps\connect.ps1`). Never copy its credential anywhere.

## Rules that govern work here

- **Mode B (WebistryDev freelance)** — footer credit `Designed & developed by WebistryDev` → https://www.webistrydev.com/ (`target="_blank" rel="noopener noreferrer"`), small, no duplicates, verified mobile **and** desktop.
- **VPS = WebistryDev only.** Never place or reference Contigoo or any other client's work there (R5). Single owner-approved exception: `faams-demo`.
- Preserve existing uncommitted work in `/home/sherif/sites/*`. QOYA, Ahmed Elakad and Zahrtelkhlig are live priorities.
- Never print or commit Leads Management `.handoff/` secrets or the QOYA encrypted credential.
- Stack for new work: Next.js, React, TypeScript, Tailwind, PostgreSQL/Neon, Drizzle, Node.js, Cloudinary, Framer Motion.

## Brainstorming

WebistryDev-specific brainstorming/notes live in **`Brainstorming.md`** (same folder). General discussion has its own sibling workspace, **`D:\Work\Brainstorming & Planning`**, by the owner's updated decision on 5 October 2026.

## Open or continue

Open **OpenCode Terminal** from the Start menu and choose **2 — WebistryDev**. Name the project; the agent reads its current VPS instructions/handoff before continuing. Older local `D:\WebistryDev` references resolve to this entry point, not to local copies of VPS source.

## Telegram continuation (laptop ↔ VPS)

- Chat memory = `Chat-Memory.md` here + mirror `/home/sherif/CHAT-MEMORY.md` on the VPS. The Telegram bridge auto-injects the mirror into every VPS agent run; VPS agents update it at milestones.
- After editing `Chat-Memory.md` here, push the mirror the same task: `connect.ps1 -Command 'base64 -d > /home/sherif/CHAT-MEMORY.md' -StdinFile <local.b64>`.
- When work will continue on Telegram, push referenced WebistryDev-scope files to `/home/sherif/transfer/` the same way (base64 locally, `base64 -d > ~/transfer/<name>`). The bridge lists that folder in every injected context. **Never push Contigoo or other-client material (R5).**
- Files the VPS agent produces for pickup land in `/home/sherif/transfer/` too — pull them before resuming locally.

## Reading order

1. Global `user-preferences.md` (auto-loaded)
2. `/home/sherif/PROJECTS-VPS.md` (on VPS)
3. The target project's own `AGENTS.md` / `PROJECT_CONTEXT.md` on the VPS
