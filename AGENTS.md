# Workspace Architecture & Context

You are operating in a dual-environment workspace. You MUST strictly follow these rules based on the project:

## 1. WebistryDev (VPS / Remote Only)
- **Location:** Remote VPS at `/home/sherif/workspaces/WebistryDev`.
- **Connection:**
  - User: `root`
  - Host/IP: `76.13.42.219`
  - Port: `22`
  - Auth: Passwordless SSH using the key at `~/.ssh/id_rsa` on the local machine.
  - Remote path: `/home/sherif/workspaces/WebistryDev`
- **Rule:** Use the terminal tool to run remote commands via `ssh root@76.13.42.219 "..."`. NEVER attempt to run local development servers for WebistryDev. All work, testing, and execution for WebistryDev must be framed as remote operations. Never look for or edit local source code for WebistryDev; always operate on the remote path above.

# WebistryDev Branch & Safety Rules (NON-NEGOTIABLE)

These override any conflicting guidance elsewhere in this file.

## Branch
- **The only valid branch is `main`.** Never edit, commit, or push on `master`, a feature branch, or a detached HEAD.
- Before ANY change, run and verify:
  - `sudo -u sherif git -C /home/sherif/workspaces/WebistryDev checkout main`
  - `sudo -u sherif git -C /home/sherif/workspaces/WebistryDev branch --show-current` → must print `main`
- If `main` is missing, the checkout fails, or the repo is detached: **STOP and report**. Do not force checkout, do not stash, do not reset.

## Source of truth
- `/home/sherif/workspaces/WebistryDev` is the **source of truth for edits**.
- Edit there, on `main`, then deploy per the Infrastructure Map below.
- `/home/sherif/sites/*` are runtime/deployment directories — do not treat them as the primary edit location unless the user explicitly says so.

## Hard stops
- **NEVER run `pm2 restart all`.** It kills the OpenCode harness (`opencode-web`, `opencode-serve`, `opencode-telegram`). Restart only the exact process name, and only with confirmation.
- **NEVER commit or push without showing the diff first.** Run `git status` + `git diff` (and `git diff --staged` if anything is staged), present it to the user, and wait for explicit approval.
- Immediately before any push, re-confirm the branch is `main`.

## 2. Contigoo (Local Only)
- **Location:** Local folder `./Contigoo`.
- **Rule:** This is a local project. You can read, write, and execute code directly inside the `./Contigoo` folder. You can run local dev servers, tests, and scripts for this project.

## 3. Brainstorming & Planning (Local Only)
- **Location:** Local folder `./Brainstorming & Planning`.
- **Rule:** Use this folder for architecture design, documentation, and idea generation. Do not write production code here.

# WebistryDev Task Protocol

Apply this protocol to every task on the WebistryDev VPS or any project under `/home/sherif/workspaces/WebistryDev/Projects`.

## 1. Scope
- Confirm which project is targeted (main site vs. a subproject under `Projects/`) and which files are affected.
- Confirm the response language set. Copy lives in `lib/translations.ts` and is bilingual (`ar` + `en`); unless told otherwise, update both blocks.
- Read `PROJECT_GUIDE.md` / `PROJECT_CONTEXT.md` on first task in a session to learn the deploy pipeline instead of guessing.

## 2. Inspect (read-only)
- Use `ssh root@76.13.42.219 "..."` for all reads: `ls`, `cat`, `sed`, `grep`, `git status`, `git log`.
- Quoting: wrap the remote command in double quotes, keep the PowerShell outer string single-quoted. Avoid nested `"` in the remote command — braces and `$()` get mangled by PowerShell.
- Never edit a file before reading its current contents.

## 3. Approve
- Present the exact diff (file + before/after) before writing, especially for multi-file changes, copy, pricing, or anything user-facing.
- Wait for explicit confirmation.

## 4. Apply
- Confirm the branch first: `sudo -u sherif git -C <repo> checkout main` and verify it prints `main` (see Branch & Safety Rules).
- Back up first: `cp file file.bak.$(date +%Y%m%d%H%M%S)` on the VPS.
- Write via SSH (`cat > file <<'EOF'` heredoc or `sed`), never from the local `D:\Work\WebistryDev` folder.
- Keep changes minimal and consistent with surrounding code style.

## 5. Validate (remote)
- Run build/type checks on the VPS, e.g. `npm run build`, `npx tsc --noEmit`, `npm run lint`.
- Report actual command output. Never claim success without it.

## 6. Deploy
- Look up the target in the **WebistryDev Infrastructure Map** below BEFORE editing. Hosting differs per project: some are Vercel (git push), some are pm2 services on this VPS.
- Vercel-hosted: commit, then `sudo -u sherif git push`. Vercel builds remotely; no VPS build step needed.
- VPS-hosted (pm2): edit source under `/home/sherif/sites/<app>`, build if that app needs it, then `sudo -u sherif pm2 restart <exact-name>`.
- Never deploy without confirmation, even if the build passes.

## 7. Report
- List files changed, commands run, build result, and the live URL to verify.

## Hard Stops (always ask first)
- Destructive git: `reset --hard`, `checkout -- .`, `push --force`, branch/tag deletion.
- `pm2 restart all`, `pm2 delete`, or killing processes you did not start. The OpenCode harness itself runs under pm2 as user `sherif` (`opencode-web`, `opencode-serve`, `opencode-telegram`) — restarting all would kill the session.
- Deleting or overwriting directories, or restoring the `Archive/` folder into live paths.
- Anything that mutates production data: DB migrations, `seed`, `db:push`, bulk deletes.
- Reading secret values from `.env.local` into the conversation. Use them on the server only; never echo or commit them.
- Declaring a task done without a passing remote build.

## Local Machine Limits
- The local `D:\Work\WebistryDev` folder is NOT a source of truth. Do not read, edit, or build from it.
- No local dev servers, no local `npm run dev`, no local builds for WebistryDev.

# WebistryDev Infrastructure Map

Verified 2026-10-25. Hosting is split across Vercel and this VPS — never assume one model.

## VPS service topology (pm2 as user `sherif`)

| pm2 name | Port | Source dir | Notes |
|---|---|---|---|
| `webistrydev` | 3001 | `/home/sherif/sites/webistrydev` | VPS copy; public domain is served by Vercel, not this process |
| `ahmed-elakad-live` | 3002 | `/home/sherif/sites/ahmed-elakad-releases/20261010-chat-always` | release-dir pattern, not `sites/Ahmed-Elakad` |
| `studio` | 3210 | `/home/sherif/sites/studio` | serves `studio.<ip>.nip.io` |
| `orbany-api` | 3400 | `/home/sherif/sites/orbany-store/api` | static dist at `orbany-store/web/dist` |
| `opencode-web` / `-serve` / `-telegram` | 4096 | `/home/sherif` | the agent harness itself — never bulk-restart |

Also running: nginx (all 443 vhosts), certbot.timer.

## Domain routing

| Domain | DNS → | Served by | Vhost file |
|---|---|---|---|
| webistrydev.com | 216.198.79.1 (Vercel) | **Vercel** | nginx vhost removed 2026-10-25 (was orphaned) |
| www.webistrydev.com | 76.76.21.123 (Vercel) | **Vercel** | — |
| ahmedelakad.com | 76.13.42.219 | VPS → `127.0.0.1:3002` | `sites-enabled/ahmedelakad.com` (**real file, not a symlink**) |
| studio.*.nip.io | VPS | VPS → `:3210` | symlink |
| orbany.*.nip.io | VPS | VPS → `:3400` | symlink |
| qoya-preview.*.nip.io | VPS | VPS → `:3111` — **502, nothing listening** | symlink |
| opencode.*.nip.io | VPS | VPS → `127.0.0.1:4096` (HTTP 401 = auth) | symlink |
| webcorner.com | 64.190.63.111 (external) | **not this VPS**; local vhost is inert | symlink |

## Repo / deploy mapping

| Project path | Remote | Branch | Deploy |
|---|---|---|---|
| `/home/sherif/sites/webistrydev` | `SherifAsh93/webistrydev` | `main` | Vercel (`webistrydev` project) |
| `/home/sherif/workspaces/WebistryDev` | `SherifAsh93/webistrydev` | **`main` required** (was found on `master` — checkout before any edit) | **Source of truth for edits** |
| `Projects/Ahmed-Elakad` | `SherifAsh93/Ahmed-Elakad` | varies | Vercel (`ahmed-elakad`) |
| `Projects/Zahrtelkhlig` | `SherifAsh93/Zahrtelkhlig` | main | Vercel (`zahrtelkhlig`) |
| `Projects/Leads` / `sites/leads-form` | `SherifAsh93/leads-form` | main | Vercel (`leads-form`) |
| `Projects/mr-mohammed` / `sites/mr-mohammed` | `SherifAsh93/mr-mohammed` | main | Vercel |
| `sites/elghaly-vr` | `SherifAsh93/elghaly-vr` | main | Vercel |
| `sites/Montelle` | `SherifAsh93/Montelle-Couture` | main | Vercel (`montelle-couture`) |
| `sites/olympia-club` | `SherifAsh93/olympia-club` | main | Vercel |
| `sites/Qoya Furniture` | `SherifAsh93/Qoya-Furniture` | main | Vercel (linked) |
| `sites/Leads-Management` | no remote | main | local only |
| `sites/orbany-store` | no remote | main | pm2 `orbany-api` on VPS |

Other `sites/` entries are symlinks into `workspaces/WebistryDev/Projects/` (Ameer-dental-clinic, Bebo Website, Furniture-Studio, Leads, Leads-Management, Sunset-Management, batrawy-clinic, hadi-alfudaily, leads-form, mr-mohammed, zahrtelkhlig).

## Operational rules

- `sites-enabled/ahmedelakad.com` is a real file; `sites-available/ahmedelakad.com` is stale (`:3000` vs live `:3002`). Edit the enabled file and reload.
- Git must run as `sherif`: `sudo -u sherif git -C <dir> ...`. Running as root fails with "dubious ownership".
- Pushes work via `credential.helper=store` + `/home/sherif/.git-credentials`, and some remotes embed a PAT in the URL. Never rewrite remotes.
- The workspace repo has long-standing uncommitted doc edits — always `git add <exact files>`, never `git add -A`.
- `webistrydev.com` on the VPS has no TLS vhost anymore. If DNS is ever pointed back to `76.13.42.219`, re-issue a cert and restore the vhost from `/root/nginx-backup-20261025/webistrydev.com.vhost`.

## Known issues (as of 2026-10-25)

- `qoya-preview.*.nip.io` returns 502 — nothing listens on :3111. Vhost and cert still active.
- GitHub PAT appears in plaintext in several `origin` URLs on the VPS. Rotate it and move to SSH deploy keys or `gh auth`.
- `qoya-preview` and `webcorner.com` configs are leftovers; confirm with the user before touching.


# Contigoo Map (local)

Verified 2026-10-25. `D:\Work\Contigoo` is a container of separate projects, not one app. Confirm which subproject a task means before editing.

| Subproject | App roots (package.json) | Notes |
|---|---|---|
| `01 - Faams Project` | — | no package root at top level |
| `02 - Contigoo Cinematic Studio` | `studio/package.json` | — |
| `03 - Contigoo Development Studio` | `platform/`, `database/`, `document-tools/`, `prototype/` | monorepo-style, multiple apps |
| `04 - MTG` | — | — |
| `05 - Naseej Project` | `package.json` | own `.git` repo (nested) |
| `faams-management-demo` | `package.json` | own `.git` repo (nested) |
| `Alia Done`, `Brand Assets`, `Phantom Hardware`, `Contigoo Engine Platform` | — | no package root at depth 2 |

- The enclosing git repo for `Contigoo/` is `D:\Work` (branch `main`).
- Nested repos (`05 - Naseej Project`, `faams-management-demo`) commit separately from `D:\Work`.
- Run dev servers/tests per subproject directory, never from `D:\Work` root.

# Workflow
1. Identify the target project (WebistryDev, Contigoo, or Planning).
2. Apply the correct environment rule (Remote for Webistry, Local for Contigoo).
3. Use the `planner` subagent to create a plan.
4. Execute or provide the remote commands.
5. Use the `oracle` subagent to review.