# Contigoo — workspace knowledge base (Mode A)

Global rules live in `C:\Users\sheri\.config\opencode\user-preferences.md` and load automatically. Read them first. This file only adds the Contigoo environment context.

## Where the work actually is

- **All Contigoo work is local-only** at `D:\Work\Contigoo` (owner rule R6). Nothing Contigoo is hosted/deployed on the VPS or laptop except the explicitly approved FAAMS demo (now moved local).
- **Production (future):** When a Contigoo project is approved and fully planned, it will be implemented on a **separate server + separate domain** (cloud or dedicated local server machine), chosen at that time. Not this laptop, not the personal VPS, not `contigooltd.com` by default.
- **Allowed external exception:** Hosted development databases already approved (e.g., Neon Frankfurt `contigoo-studio-dev` for Contigoo Studio) remain in use — the boundary targets servers/VPS/hosting, not approved dev-DB services.
- **Workspace index:** `Sherif Notes.md` — read this first for the project map and current status.

## Rules that govern work here

- **Mode A (Contigoo agency)** — Contigoo's offer/branding: CRM (incl. Real Estate CRM), WhatsApp/Messenger Bot, AI Creative, AI Ads, Social management; services — website builds, software projects, branding, training. Meta Official Partner, AR + EN, EGP pricing, built in Cairo.
- **No personal branding** on Contigoo work: no WebistryDev footer credit, no personal rates or portfolio pricing, unless explicitly asked.
- **Sherif's position:** Technical-delivery person accompanying the CEO — custom builds, integrations, landing pages, inventory systems, CRM implementations.
- **VPS boundary:** The VPS `76.13.42.219` is WebistryDev ONLY (R5). Single owner-approved exception was `faams-demo` (now moved local). No Contigoo content on VPS.

## Project structure

```
D:\Work\Contigoo\
├── AGENTS.md                    ← this file
├── Chat-Memory.md               ← running state log (update at milestones)
├── Sherif Notes.md              ← workspace index / project map
├── Brainstorming.md             ← Contigoo-specific brainstorming
├── 01 - Faams Project/          ← FAAMS (management demo, now local)
├── 02 - Contigoo Cinematic Studio/
├── 03 - Contigoo Development Studio/  ← Contigoo Studio (Neon dev DB approved)
├── 04 - MTG/
├── 05 - Naseej Project/         ← SHIPPED (naseej-project.vercel.app)
├── Alia Done/
├── Brand Assets/
├── Contigoo Engine Platform/    ← the Dynamics 365-style platform vision
├── faams-management-demo/       ← cloned from GitHub, builds locally
└── Phantom Hardware/
```

## Brainstorming

Contigoo-specific brainstorming/notes live in **`Brainstorming.md`** (same folder). General discussion has its own sibling workspace, **`D:\Work\Brainstorming & Planning`**.

## Open or continue

Open **OpenCode Terminal** from the Start menu and choose **1 — Contigoo**. Name the project; the agent reads `Sherif Notes.md`, the project's current instructions/handoff, and `Chat-Memory.md` before continuing.

## Memory & continuity (local-only)

- Chat memory = `Chat-Memory.md` here only. No VPS mirror (R5 — VPS is WebistryDev only).
- Update `Chat-Memory.md` at milestones (compact state log, never a transcript).
- Before closing a session that made progress, push the latest state to `Chat-Memory.md`.
- On resume: read `Sherif Notes.md` → project's `AGENTS.md`/handoff → `Chat-Memory.md` → continue recorded next task.

## Reading order

1. Global `user-preferences.md` (auto-loaded)
2. `D:\Work\Contigoo\Sherif Notes.md` (workspace index)
3. The target project's own `AGENTS.md` / handoff / context docs
4. `D:\Work\Contigoo\Chat-Memory.md` (current state)