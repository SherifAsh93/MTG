import { findJob } from "@/lib/store";
import { comfyFetch } from "@/lib/comfy";
import { apiError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string; index: string }> }) {
  try {
    const { id, index } = await context.params;
    const job = findJob(id);
    const asset = /^\d+$/.test(index) ? job?.assets[Number(index)] : undefined;
    if (!asset || job?.status !== "completed") return Response.json({ error: "Asset not found." }, { status: 404 });
    const params = new URLSearchParams({ filename: asset.filename, subfolder: asset.subfolder, type: asset.type });
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("Range", range);
    const upstream = await comfyFetch(`view?${params}`, { headers });
    if (!upstream.ok) return Response.json({ error: "Output unavailable on the GPU worker." }, { status: upstream.status === 404 ? 404 : 502 });
    const outputHeaders = new Headers({ "Cache-Control": "private, max-age=3600" });
    for (const name of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const value = upstream.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    if (new URL(request.url).searchParams.has("download")) {
      outputHeaders.set("Content-Disposition", `attachment; filename="${asset.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`);
    }
    return new Response(upstream.body, { status: upstream.status, headers: outputHeaders });
  } catch (error) { return apiError(error); }
}
