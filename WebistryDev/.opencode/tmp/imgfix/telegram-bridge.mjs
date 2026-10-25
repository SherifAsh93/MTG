#!/usr/bin/env node
/** Telegram → OpenCode bridge: serial queue, per-chat session continuity, plain-text replies. */
import { spawn } from "node:child_process";
import fs from "node:fs";

const HOME = "/home/sherif";
const ENV_FILE = `${HOME}/sites/Ahmed-Elakad/.env.telegram`;
const SESSIONS_FILE = `${HOME}/.config/opencode/telegram-bridge-sessions.json`;
const LOG_FILE = `${HOME}/.config/opencode/telegram-bridge.log`;
const STARTED_MARKER = `${HOME}/.config/opencode/telegram-bridge.started`;
const OPENCODE_BIN = `${HOME}/.npm-global/bin/opencode`;
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
const POLL_TIMEOUT_S = 30;

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(ENV_FILE);
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT = String(env.TELEGRAM_CHAT_ID || "").trim();
if (!BOT_TOKEN || !ALLOWED_CHAT) {
  console.error("telegram-bridge: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in " + ENV_FILE);
  process.exit(1);
}

let logSize = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;
function log(line) {
  const s = `[${new Date().toISOString()}] ${line}\n`;
  try {
    if (logSize > 1_000_000) { fs.writeFileSync(LOG_FILE, ""); logSize = 0; }
    fs.appendFileSync(LOG_FILE, s);
    logSize += s.length;
  } catch {}
}

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
async function tg(method, payload, timeoutMs = 15000) {
  const r = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const j = await r.json().catch(() => ({ ok: false }));
  if (!j.ok) throw new Error(`${method}: ${j.description || r.status}`);
  return j;
}

async function send(text, chunkSize = 3900) {
  const t = String(text).trim() || "✅ done (no text reply)";
  const chunks = [];
  for (let i = 0; i < t.length; i += chunkSize) chunks.push(t.slice(i, i + chunkSize));
  for (const c of chunks) {
    await tg("sendMessage", { chat_id: ALLOWED_CHAT, text: c, disable_web_page_preview: true });
    if (chunks.length > 1) await new Promise((r) => setTimeout(r, 250));
  }
}

const MODELS = {
  free: { id: "opencode/mimo-v2.6-flash-free", label: "⚡ Free (mimo-v2.6)" },
  pro: { id: "openai/gpt-6.1-sol", label: "🧠 GPT-6.1-sol" },
};
const PENDING_TTL_MS = 30 * 60 * 1000;
const pending = new Map();

function loadSessions() { try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8")); } catch { return {}; } }
function saveSessions(s) { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2)); }
const sessions = loadSessions();

function runAgent(userText, sessionId, modelId) {
  return new Promise((resolve) => {
    const args = ["run", userText, "--format", "json", "--auto", "--model", modelId, "--port", String(4200 + Math.floor(Math.random() * 90)), "--dir", HOME];
    if (sessionId) args.push("-s", sessionId);
    const child = spawn(OPENCODE_BIN, args, {
      cwd: HOME,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PATH: `${HOME}/.npm-global/bin:${process.env.PATH}` },
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, RUN_TIMEOUT_MS);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { if (err.length < 20000) err += d; });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    child.on("error", (e) => { clearTimeout(timer); resolve({ code: -1, out, err: String(e) }); });
  });
}

function parseRun(out) {
  let sessionId = null;
  const text = [];
  for (const line of out.split("\n")) {
    const s = line.trim();
    if (!s.startsWith("{")) continue;
    let ev;
    try { ev = JSON.parse(s); } catch { continue; }
    if (ev.sessionID && !sessionId) sessionId = ev.sessionID;
    if (ev.type === "text" && ev.part && typeof ev.part.text === "string" && ev.part.text.trim()) text.push(ev.part.text);
  }
  return { sessionId, text: text.join("\n").trim() };
}

let busy = false;
const queue = [];
function setPicker(pickerMsgId, text) {
  if (!pickerMsgId) return;
  tg("editMessageText", { chat_id: ALLOWED_CHAT, message_id: pickerMsgId, text, reply_markup: { inline_keyboard: [] } }).catch(() => {});
}
function enqueue(fn) {
  queue.push(fn);
  void drain();
}
async function drain() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const job = queue.shift();
    try { await job(); } catch (e) { log(`job error: ${e.message || e}`); }
  }
  busy = false;
}

function agentJob(chatText, modelKey, pickerMsgId) {
  return async () => {
    const t0 = Date.now();
    const model = MODELS[modelKey] || MODELS.free;
    const typing = setInterval(() => {
      tg("sendChatAction", { chat_id: ALLOWED_CHAT, action: "typing" }).catch(() => {});
    }, 5000);
    tg("sendChatAction", { chat_id: ALLOWED_CHAT, action: "typing" }).catch(() => {});
    try {
      const prev = sessions[ALLOWED_CHAT];
      const r = await runAgent(chatText, prev, model.id);
      if (r.code === 137) {
        setPicker(pickerMsgId, `⏰ ${model.label} — timed out after 10 minutes.`);
        await send("⏰ The task exceeded 10 minutes and was stopped.");
        log(`timeout model=${model.id} after ${Date.now() - t0}ms`);
        return;
      }
      if (r.code !== 0) {
        log(`exit=${r.code} err=${(r.err || "").slice(-500)}`);
        const detail = (r.err || r.out || "").trim().slice(-800) || "No output.";
        setPicker(pickerMsgId, `⚠️ ${model.label} — failed (exit ${r.code}).`);
        await send(`⚠️ opencode exited with code ${r.code}.\n${detail}`);
        return;
      }
      const { sessionId, text } = parseRun(r.out);
      if (sessionId) { sessions[ALLOWED_CHAT] = sessionId; saveSessions(sessions); }
      const reply = text || r.out.trim() || "✅ done (no text reply)";
      setPicker(pickerMsgId, `▶︎ ${model.label} — finished in ${Math.round((Date.now() - t0) / 1000)}s`);
      await send(reply);
      log(`ok model=${model.id} session=${sessionId || "-"} replyLen=${reply.length} dur=${Date.now() - t0}ms`);
    } catch (e) {
      log(`error: ${e.message || e}`);
      setPicker(pickerMsgId, `⚠️ ${model.label} — bridge error.`);
      try { await send(`⚠️ bridge error: ${e.message || e}`); } catch {}
    } finally {
      clearInterval(typing);
    }
  };
}

let offset = 0;
let consecutivePollErrors = 0;
async function poll() {
  for (;;) {
    try {
      const j = await tg(
        "getUpdates",
        { timeout: POLL_TIMEOUT_S, offset, allowed_updates: ["message", "callback_query"] },
        (POLL_TIMEOUT_S + 20) * 1000
      );
      consecutivePollErrors = 0;
      if (j.result.length) offset = j.result[j.result.length - 1].update_id + 1;
      for (const up of j.result) {
        if (up.callback_query) {
          const q = up.callback_query;
          if (!q.message || String(q.message.chat.id) !== ALLOWED_CHAT) { tg("answerCallbackQuery", { callback_query_id: q.id }).catch(() => {}); continue; }
          const key = String(q.data || "").startsWith("run:") ? q.data.slice(4) : null;
          const entry = key ? pending.get(q.message.message_id) : null;
          pending.delete(q.message.message_id);
          if (!entry || Date.now() - entry.at > PENDING_TTL_MS) {
            tg("answerCallbackQuery", { callback_query_id: q.id, text: "expired — send the message again" }).catch(() => {});
            tg("editMessageReplyMarkup", { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
            continue;
          }
          const text = entry.text;
          const model = MODELS[key] || MODELS.free;
          tg("answerCallbackQuery", { callback_query_id: q.id }).catch(() => {});
          tg("editMessageText", {
            chat_id: q.message.chat.id,
            message_id: q.message.message_id,
            text: `${model.label} — ⏳ running…\n\n${text.slice(0, 300)}${text.length > 300 ? "…" : ""}`,
            reply_markup: { inline_keyboard: [] },
          }).catch(() => {});
          enqueue(agentJob(text, key, q.message.message_id));
          continue;
        }
        const msg = up.message;
        if (!msg || !msg.chat) continue;
        if (String(msg.chat.id) !== ALLOWED_CHAT) { log(`ignored update from chat ${msg.chat.id}`); continue; }
        const text = (msg.text || "").trim();
        if (!text) continue;
        if (text === "/start" || text === "/help") {
          enqueue(async () => send("🤖 OpenCode VPS bridge.\nSend any message → pick ⚡ Free or 🧠 GPT-6.1-sol with the buttons → the agent runs on the VPS and replies here.\n/new = fresh session\n/status = bridge info"));
        } else if (text === "/new") {
          delete sessions[ALLOWED_CHAT];
          saveSessions(sessions);
          enqueue(async () => send("🆕 New agent session started."));
        } else if (text === "/status") {
          enqueue(async () => send(`✅ bridge online\nsession: ${sessions[ALLOWED_CHAT] || "(none yet)"}\nqueued: ${queue.length}`));
        } else {
          const now = Date.now();
          for (const [mid, p] of pending) if (now - p.at > PENDING_TTL_MS) pending.delete(mid);
          const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
          const sent = await tg("sendMessage", {
            chat_id: ALLOWED_CHAT,
            text: `🧠 Choose model\n\n${preview}`,
            reply_markup: { inline_keyboard: [[
              { text: MODELS.free.label, callback_data: "run:free" },
              { text: MODELS.pro.label, callback_data: "run:pro" },
            ]] },
          });
          if (sent.result && sent.result.message_id) pending.set(sent.result.message_id, { text, at: now });
        }
      }
    } catch (e) {
      consecutivePollErrors++;
      log(`poll error (${consecutivePollErrors}): ${e.message || e}`);
      if (consecutivePollErrors === 5) {
        try { await send("⚠️ Telegram bridge polling is failing — will keep retrying."); } catch {}
      }
      await new Promise((r) => setTimeout(r, Math.min(30000, 2000 * consecutivePollErrors)));
    }
  }
}

log("bridge starting");
poll().then(() => {});
if (!fs.existsSync(STARTED_MARKER)) {
  fs.writeFileSync(STARTED_MARKER, String(Date.now()));
  send("🤖 OpenCode ↔ Telegram bridge is live on the VPS.\nSend a message and pick ⚡ Free or 🧠 GPT-6.1-sol with the buttons.\n/new = fresh session · /status = info")
    .then(() => log("startup ping sent"))
    .catch((e) => log(`startup ping failed: ${e.message}`));
}
