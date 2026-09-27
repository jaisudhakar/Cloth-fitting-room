/**
 * Optional photoreal try-on, proxied to the FASHN API so the key stays on the
 * server. Without FASHN_API_KEY the fitting room still works with its in-browser
 * preview; this route just reports itself as disabled.
 *
 *   GET  /api/try-on            -> { enabled }
 *   POST /api/try-on            -> { id }       body: { modelImage, garmentImage, category }
 *   GET  /api/try-on?id=<id>    -> { status, output?, error? }
 */

const API = process.env.FASHN_API_URL ?? "https://api.fashn.ai/v1";
const MODEL = process.env.FASHN_MODEL ?? "tryon-v1.6";
const CATEGORIES = new Set(["auto", "tops", "bottoms", "one-pieces"]);
// Data URLs of downscaled photos are well under this.
const MAX_IMAGE_CHARS = 8_000_000;

const key = () => process.env.FASHN_API_KEY;

const isImage = (v: unknown): v is string =>
  typeof v === "string" && v.length < MAX_IMAGE_CHARS && (/^data:image\/(png|jpeg|webp);base64,/.test(v) || /^https:\/\//.test(v));

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ enabled: !!key() });
  if (!key()) return Response.json({ error: "AI try-on is not configured" }, { status: 503 });
  if (!/^[\w-]{1,128}$/.test(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const res = await fetch(`${API}/status/${id}`, { headers: { Authorization: `Bearer ${key()}` }, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return Response.json({ error: data?.error?.message ?? data?.error ?? `Upstream error ${res.status}` }, { status: 502 });
  return Response.json({
    status: data.status,
    output: Array.isArray(data.output) ? data.output : undefined,
    error: data.error ? (data.error.message ?? String(data.error)) : undefined,
  });
}

export async function POST(req: Request) {
  if (!key()) return Response.json({ error: "AI try-on is not configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const { modelImage, garmentImage, category = "auto" } = body ?? {};
  if (!isImage(modelImage) || !isImage(garmentImage) || !CATEGORIES.has(category)) {
    return Response.json({ error: "Expected modelImage, garmentImage (data URLs) and a valid category" }, { status: 400 });
  }

  const res = await fetch(`${API}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model_name: MODEL,
      inputs: { model_image: modelImage, garment_image: garmentImage, category, garment_photo_type: "flat-lay" },
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    return Response.json({ error: data?.error?.message ?? data?.error ?? `Upstream error ${res.status}` }, { status: 502 });
  }
  return Response.json({ id: data.id });
}
