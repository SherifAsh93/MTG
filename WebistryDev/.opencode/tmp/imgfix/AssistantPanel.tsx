"use client";

import React, { useEffect, useRef, useState } from "react";

interface ToolTrace {
  name: string;
  ok: boolean;
  error?: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  tools?: ToolTrace[];
  confirmation?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  admin_overview: "checked overview",
  get_content: "read content",
  set_content_value: "updated content",
  reorder_collections: "reordered collections",
  reorder_collection_images: "reordered images",
  set_collection_cover: "set cover",
  list_clients: "searched clients",
  get_client: "read client",
  create_client: "created client",
  update_client: "updated client",
  client_action: "client action",
  delete_client: "deleted client",
  list_messages: "read messages",
  mark_message: "updated message",
  delete_message: "deleted message",
  list_ad_enquiries: "read enquiries",
  delete_ad_enquiry: "deleted enquiry",
  list_analytics: "read analytics",
  save_analytics_month: "saved analytics",
  delete_analytics_month: "deleted analytics",
  list_media: "searched media",
  change_admin_password: "changed password",
};

const MUTATING = new Set([
  "set_content_value", "reorder_collections", "reorder_collection_images", "set_collection_cover",
  "create_client", "update_client", "client_action", "delete_client",
  "mark_message", "delete_message", "delete_ad_enquiry",
  "save_analytics_month", "delete_analytics_month", "change_admin_password",
]);

export default function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-30).map((m) => ({ role: m.role, content: m.content })) }),
      });
      if (res.status === 401) {
        setError("Session expired — lock and unlock the dashboard, then try again.");
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `Request failed (${res.status})`);
      } else {
        const data = await res.json();
        const pushed: Msg[] = [{ role: "assistant", content: data.reply ?? "Done.", tools: data.tools ?? [] }];
        if (typeof data.confirmation === "string" && data.confirmation.trim()) {
          pushed.push({ role: "assistant", content: data.confirmation, confirmation: true });
        }
        setMessages((prev) => [...prev, ...pushed]);
        if ((data.tools ?? []).some((t: ToolTrace) => t.ok && MUTATING.has(t.name))) setRefreshNeeded(true);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#2a2218] text-[#e8dfd4] shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 3v-4.6A8.5 8.5 0 1 1 21 11.5Z" />
            <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end bg-black/40 sm:items-stretch" onClick={() => !busy && setOpen(false)}>
          <div
            className="flex h-[78vh] w-full flex-col rounded-t-2xl bg-[#faf9f7] shadow-2xl sm:h-full sm:w-[420px] sm:rounded-none sm:rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e8dfd4] bg-[#2a2218] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[15px] tracking-[0.18em] text-[#e8dfd4]" style={{ fontFamily: "var(--font-display)" }}>
                  ASSISTANT
                </span>
                <span className="rounded-full bg-[#b8965a]/25 px-2 py-0.5 text-[10px] tracking-wider text-[#e8dfd4]">FREE AI</span>
              </div>
              <div className="flex items-center gap-2">
                {refreshNeeded && (
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-full bg-[#b8965a] px-3 py-1 text-[11px] font-medium text-[#2a2218] hover:bg-[#a08e6e]"
                  >
                    Refresh data
                  </button>
                )}
                <button onClick={() => !busy && setOpen(false)} aria-label="Close assistant" className="text-[#e8dfd4] hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              {messages.length === 0 && (
                <div className="mx-auto max-w-[300px] rounded-xl border border-[#e8dfd4] bg-white px-4 py-4 text-center text-[13px] leading-relaxed text-[#6b6257]">
                  Tell me what you want to change on the site — content, collections, images, clients, payments, messages.
                  I do it, then verify it before replying.
                  <div className="mt-2 text-[11px] text-[#a08e6e]">Optional AI helper — all normal Admin panels stay available.</div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.confirmation ? (
                    <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl border border-[#b8965a]/60 bg-[#f7f2e8] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#3f3226]">
                      {m.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                        m.role === "user" ? "bg-[#2a2218] text-[#faf9f7]" : "border border-[#e8dfd4] bg-white text-[#1a1a1a]"
                      }`}
                    >
                      {m.tools && m.tools.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {m.tools.map((t, j) => (
                          <span
                            key={j}
                            title={t.ok ? undefined : t.error}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                              t.ok ? "bg-[#e8dfd4] text-[#6b6257]" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {t.ok ? "✓" : "✗"} {TOOL_LABELS[t.name] ?? t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.content}
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[#e8dfd4] bg-white px-4 py-2.5 text-[13px] text-[#6b6257]">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:200ms]">●</span>
                      <span className="animate-pulse [animation-delay:400ms]">●</span>
                    </span>
                    <span className="ml-2">working…</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</div>
              )}
            </div>

            <div className="border-t border-[#e8dfd4] bg-white px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder="Write what you want to change… / اكتب ما تريد تنفيذه…"
                  className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-[#e8dfd4] bg-[#faf9f7] px-3 py-2.5 text-[13.5px] text-[#1a1a1a] outline-none focus:border-[#b8965a]"
                />
                <button
                  onClick={() => void send()}
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#2a2218] text-[#e8dfd4] transition disabled:opacity-40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 text-center text-[10px] text-[#a08e6e]">
                Free AI model · every change is verified before it is reported done
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
