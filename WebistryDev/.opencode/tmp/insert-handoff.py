import sys
p = '/home/sherif/sites/Ahmed-Elakad/HANDOFF.md'
s = open(p, encoding='utf-8', newline='').read()
if 'Admin AI assistant deployed' in s:
    print('section already present')
    sys.exit(0)
anchor = '## Durable VPS originals + verified cloud outbox — deployed 7 October 2026'
if s.count(anchor) != 1:
    sys.exit('anchor count=%d' % s.count(anchor))
nl = '\r\n' if '\r\n' in s else '\n'
section = nl.join([
    '## Admin AI assistant deployed — 8 October 2026',
    '',
    '- **Feature:** authenticated AI chat panel in the Admin dashboard. The Admin types a request (AR/EN); the model executes existing Admin operations through 23 verified tools (content get/set, collections reorder/cover, clients CRUD + payments/dresses/voice notes, messages, ad enquiries, analytics, media search, admin overview, password change) and each mutation is read back before "done" is reported. Optional helper — all normal Admin panels remain the primary path.',
    '- **Model:** free Groq `openai/gpt-oss-120b`, `GROQ_API_KEY` in `.env.local` (chmod 600). Provider 429 → friendly "free AI limit reached" reply that preserves the executed-tool trace; no paid fallback exists by design. Free limits: 30 RPM / 1000 RPD / 8000 TPM.',
    '- **Files:** `src/lib/assistant.ts` (Groq loop + tools + verification), `src/app/api/admin/assistant/route.ts` (POST, `isAdmin()` gate, 1..40 messages, 8000-char cap), `src/app/admin/dashboard/AssistantPanel.tsx` (FAB + mobile bottom-sheet / desktop right panel, tool chips, refresh banner after mutations), mounted in `src/app/admin/dashboard/page.tsx`.',
    '- **Release:** `20261008-assistant` / `NEXT_DIST_DIR=.next-assistant` / port 3002. Blue/green switch via `scripts/deploy-assistant.mjs`: 4 health stages all ok, runtime cwd/dist verified, nginx backup + old `ecosystem.config.cjs` in evidence dir. Previous release `20261007-primary` retained for rollback.',
    '- **Functional tests:** `scripts/assistant-check.mjs` against the candidate — all 7 passed: unauthenticated 401; read task reports 66 clients with content untouched; synthetic client create → `addPayment` (exactly 1) → delete, clients back to 66; identical content round-trip on `about.title` reads back unchanged; every other `site_content` doc byte-identical. `scripts/assistant-ui-check.mjs` — 320×740, 390×844 (real message sent through the UI, reply shows 66), 1440×900: panel visible, 0px horizontal overflow, 0 page errors, on candidate AND on `https://ahmedelakad.com` after deploy. Screenshots: `/home/sherif/ahmed-assistant-20261008/ui-*.png`.',
    '- **Incident + recovery (8 Oct, root-caused and fixed):** the first build of `setContentValue` called `saveAndVerify(args.value)`, so a content edit saved the *single value* as the whole `site` singleton; a provider 429 also discarded the tool trace, hiding the culprit round. The `site` row became the string `"The Designer"` (23:51:24Z; again 00:22:47Z from the stale pre-fix candidate process that survived a failed restart). Restored both times with `scripts/restore-site-content.mjs` from the 18:17Z 7 Oct encrypted snapshot (PG18 `pg_restore` extraction — the local PG16 cluster cannot read v1.16 dumps): archives the corrupted value, decrypts + verifies the snapshot digest, updates only `id=\'site\'`, readback byte-identical. **Owner content is intact:** the last legitimate write was 6 Oct 20:01:41Z (pre-audit state), fully contained in the snapshot; restored doc = 11 sections / 401,384 bytes; 66 clients, 11,858 media rows untouched. Fixes: full-doc save, non-object payload guard, 429 keeps the trace, test suite resends only when zero tools executed. Post-conditions proven by the full suite passing afterward.',
    '- **Deliberately not tested:** `change_admin_password` against live (would rotate the owner password). Free-limit 429 path observed organically during testing (correct friendly message, no fallback).',
    '- **Cleanup:** plaintext dump/extraction files and temp transfer scripts removed; evidence kept in `/home/sherif/ahmed-assistant-20261008/` (pre-health baseline, deployment health, nginx backup, pre-incident config, corrupted-value archive, screenshots).',
    '',
])
s = s.replace(anchor, section + anchor, 1)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('inserted ok')
