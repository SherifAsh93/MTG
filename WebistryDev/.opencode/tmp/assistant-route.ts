import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { runAssistant, type ChatMessage } from "@/lib/assistant";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 8000;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `messages must be 1..${MAX_MESSAGES}` }, { status: 400 });
  }

  const messages: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return NextResponse.json({ error: "invalid message shape" }, { status: 400 });
    }
    if (m.content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json({ error: "message too long" }, { status: 400 });
    }
    messages.push({ role: m.role, content: m.content });
  }
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "last message must be from the user" }, { status: 400 });
  }

  try {
    const result = await runAssistant(messages);
    return NextResponse.json(result);
  } catch (e) {
    console.error("assistant route failed:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}
