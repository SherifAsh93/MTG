type Session = { id: string; uploaded: boolean; createdAt: number };
const memory = new Map<string, Session>();
const largeFiles = new WeakMap<File, string>();
const lifetime = 7 * 86400000;
const prefix = "ahmed-upload-v3:";

class UploadError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly code?: string) { super(message); }
}

async function identity(file: File) {
  // Bound browser hashing memory. Images have a 25 MB limit. Larger videos
  // can resume while this File remains selected, without buffering 100 MB.
  if (file.size <= 25 * 1024 * 1024 && globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return prefix + [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("") + ":" + file.type;
  }
  let key = largeFiles.get(file);
  if (!key) { key = prefix + crypto.randomUUID(); largeFiles.set(file, key); }
  return key;
}

function load(key: string): Session | undefined {
  let session = memory.get(key);
  try { session ||= JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* Browser storage may be disabled. */ }
  if (!session || !/^[a-f0-9-]{36}$/.test(session.id) || typeof session.uploaded !== "boolean" || !Number.isFinite(session.createdAt) || Date.now() - session.createdAt >= lifetime) return undefined;
  return session;
}
function keep(key: string, session: Session) {
  memory.set(key, session);
  try { sessionStorage.setItem(key, JSON.stringify(session)); } catch { /* In-memory resume still works. */ }
}
function forget(key: string) {
  memory.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* No persistent session to clear. */ }
}

async function api(url: string, init: RequestInit): Promise<Partial<UploadResult> & { ready?: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(150000) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new UploadError(data.error || "Upload verification is temporarily unavailable. Select the same file again to resume.", data.retryable ?? (r.status === 429 || r.status >= 500), data.code);
      return data;
    } catch (error) {
      if ((error instanceof UploadError && !error.retryable) || attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
      if (init.method === "PUT") {
        // Completion may have committed before the connection was interrupted.
        const ready = await api(url, { method: "GET", headers: init.headers });
        if (ready.url) return ready;
      }
    }
  }
  throw new Error("Upload request failed");
}

export type UploadResult = { url: string; thumbnail?: string; backup: "pending" | "verified"; message: string };
export async function uploadMediaResult(file: File): Promise<UploadResult> {
  const max = (file.type.startsWith("image/") ? 25 : 100) * 1024 * 1024;
  if (file.size < 1 || file.size > max) throw new Error(`Maximum upload size is ${max / 1024 / 1024} MB`);
  const key = await identity(file);
  const session = load(key) || { id: crypto.randomUUID(), uploaded: false, createdAt: Date.now() };
  keep(key, session);
  try {
    const url = `/api/upload/local?id=${session.id}`;
    const hash = key.slice(prefix.length).split(":")[0];
    const headers: Record<string, string> = { "Content-Type": file.type.split(";")[0], "X-Upload-Type": file.type.split(";")[0], "X-Upload-Bytes": String(file.size), "X-Upload-Name": encodeURIComponent(file.name) };
    if (/^[a-f0-9]{64}$/.test(hash)) headers["X-Upload-SHA256"] = hash;
    // A lost response/reload checks the durable receipt before sending any bytes again.
    let completed = await api(url, { method: "GET", headers });
    if (!completed.url) completed = await api(url, { method: "PUT", headers, body: file });
    if (typeof completed.url !== "string") throw new Error("Upload confirmation was incomplete. Select the same file again to resume.");
    forget(key);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("media-backup-update", { detail: completed }));
    return completed as UploadResult;
  } catch (error) {
    if (error instanceof UploadError && ["UPLOAD_EXPIRED", "UPLOAD_CONFLICT"].includes(error.code || "")) forget(key);
    if (error instanceof UploadError && error.code === "UPLOAD_MISSING") { session.uploaded = false; keep(key, session); }
    if (error instanceof TypeError) throw new Error("The upload connection was interrupted. Keep the original and select the same file again to retry.");
    throw error;
  }
}

export async function uploadMedia(file: File): Promise<string> { return (await uploadMediaResult(file)).url; }

/** Continue independent files after a partial failure; retain filename-level results. */
export async function uploadBatch(files: File[], progress: (current: number, total: number) => void = () => {}, upload = uploadMediaResult) {
  const saved: (UploadResult & { filename: string })[] = [];
  const failed: { filename: string; error: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    progress(i + 1, files.length);
    try { saved.push({ ...await upload(files[i]), filename: files[i].name }); }
    catch (e) { failed.push({ filename: files[i].name, error: e instanceof Error ? e.message : "Upload failed" }); }
  }
  return { saved, failed, pending: saved.filter(s => s.backup !== "verified").length };
}
