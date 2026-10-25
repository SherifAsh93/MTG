import { isAdmin } from "@/lib/auth";
import { registerPrimary } from "@/lib/primary-media";
import { matchesSpec, PrimaryError, readReceipt, savePrimaryUpload, validateSpec, verifyFile, type UploadSpec } from "@/lib/primary-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
function spec(req: Request): UploadSpec {
  const result = { id: new URL(req.url).searchParams.get("id") || "", bytes: Number(req.headers.get("x-upload-bytes")), contentType: req.headers.get("x-upload-type") || "", filename: decodeURIComponent(req.headers.get("x-upload-name") || "upload"), sha256: req.headers.get("x-upload-sha256") || undefined };
  validateSpec(result); return result;
}
function failed(e: unknown) {
  const code = e instanceof PrimaryError ? e.code : "LOCAL_SAVE_FAILED";
  const status = e instanceof PrimaryError ? e.status : 503;
  console.error("Primary upload", { code, status });
  return json({ code, error: status === 429 ? "Another upload is being saved. Retrying is safe." : "File not confirmed in the library. Keep the original and retry the same file. " + code, retryable: status === 429 || status >= 500 }, status);
}
function result(r: { id: string; cloud: string }) {
  return json({ url: `/api/media/${r.id}`, thumbnail: `/api/media/${r.id}?w=400`, backup: r.cloud, message: r.cloud === "verified" ? "Saved on VPS; cloud copy verified." : "Saved on VPS; cloud backup pending. Keep your original until verified." });
}
export async function GET(req: Request) {
  if (!(await isAdmin())) return json({ error: "Session expired. Please sign in again.", retryable: false }, 401);
  try {
    const s = spec(req), r = await readReceipt(s.id);
    if (!r || !r.registered) return json({ ready: false });
    matchesSpec(r, s); await verifyFile(r); return result(r);
  } catch (e) { return failed(e); }
}
export async function PUT(req: Request) {
  if (!(await isAdmin())) return json({ error: "Session expired. Please sign in again.", retryable: false }, 401);
  const origin = req.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try { const o = new URL(origin); sameOrigin = ["http:", "https:"].includes(o.protocol) && o.host === req.headers.get("host"); } catch { /* Invalid origin. */ }
    // Next's internal request URL can use localhost while Host retains the browser origin.
    if (!sameOrigin) return json({ error: "Invalid origin", retryable: false }, 403);
  }
  try {
    const s = spec(req);
    const length = req.headers.get("content-length");
    if (length !== null && Number(length) !== s.bytes) throw new PrimaryError("UPLOAD_SIZE", 413);
    if (!req.body) throw new PrimaryError("UPLOAD_INCOMPLETE", 400);
    return result(await savePrimaryUpload(s, req.body, registerPrimary));
  } catch (e) { return failed(e); }
}
