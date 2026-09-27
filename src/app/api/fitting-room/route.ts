/**
 * "Draw the look": sends the mannequin photo plus the picked garments to
 * Google's Gemini image model and returns the composite.
 *
 * Like the reference demo, the shopper supplies their own Google AI key
 * (x-goog-api-key header). A server-wide GEMINI_API_KEY is used as a fallback
 * when set. Images are read from public/ by slug, so the client can't make the
 * server fetch arbitrary URLs.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type Layer, LAYERS, layerOf, productBySlug } from "@/lib/catalog";

export const runtime = "nodejs";
export const maxDuration = 120;

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = [process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image", "gemini-2.5-flash-image"];
const PUBLIC = join(process.cwd(), "public");
const MODEL_IMAGE = "/assets/images/tryon/model-man.jpg";

const WEAR: Record<Layer, string> = {
  headwear: "worn on the head, centred on the skull with the crown enclosing the top of the head, brim casting a soft shadow",
  top: "worn on the torso with both sleeves on the arms and a correct neckline around the neck",
  outerwear: "worn as the outer layer over the top, both sleeves on the arms, hanging naturally open",
  bottom: "worn on the legs from the waist down, both legs covered, waistband at the natural waist",
  footwear: "worn on both feet, flat on the floor, ankles meeting the hems, with a contact shadow",
};

const mime = (path: string) => (path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg");

async function inline(path: string) {
  const data = await readFile(join(PUBLIC, path));
  return { inline_data: { mime_type: mime(path), data: data.toString("base64") } };
}

function prompt(garments: { name: string; layer: Layer }[]) {
  return [
    "Virtual fitting-room composite, photorealistic studio photography.",
    "IMAGE 1 is the base figure: a matte light-grey full-body male display mannequin, frontal pose, plain grey studio backdrop.",
    garments.map((g, i) => `IMAGE ${i + 2} is ${g.name}.`).join(" "),
    "Render ONE photograph of that SAME mannequin (identical body, frontal pose, camera, lighting and background) now DRESSED in these garments worn together as one outfit:",
    garments.map((g) => `- ${g.name}, ${WEAR[g.layer]}`).join("\n"),
    "Requirements: full body visible from head to feet, nothing cropped. Garments wrap the body in 3D with natural folds and drape, never a flat pasted cut-out. Respect the layering order. Keep each garment's exact colour, pattern and material. Plain studio background. No text, watermarks, props or extra people. Portrait 3:4.",
  ].join("\n");
}

export async function POST(req: Request) {
  const key = req.headers.get("x-goog-api-key")?.trim() || process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Add your Google AI key first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { garments?: unknown } | null;
  const slugs = Array.isArray(body?.garments) ? body.garments.filter((s): s is string => typeof s === "string").slice(0, 5) : [];
  const products = slugs.map(productBySlug).filter((p) => !!p);
  if (!products.length) return Response.json({ error: "Pick at least one garment." }, { status: 400 });

  const garments = products
    .map((p) => ({ name: p.name.en, layer: layerOf(p), image: p.image }))
    .sort((a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));

  let parts;
  try {
    parts = [{ text: prompt(garments) }, await inline(MODEL_IMAGE), ...(await Promise.all(garments.map((g) => inline(g.image))))];
  } catch {
    return Response.json({ error: "Store images are missing on the server. Run `npm run assets`." }, { status: 500 });
  }

  let lastError = "The image model returned no picture.";
  for (const model of MODELS) {
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "3:4" } },
      }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 404) {
      lastError = json?.error?.message ?? `Model ${model} not found.`;
      continue;
    }
    if (!res.ok) {
      const msg: string = json?.error?.message ?? `Google AI error ${res.status}`;
      const status = [400, 401, 403, 429].includes(res.status) ? res.status : 502;
      return Response.json({ error: msg }, { status });
    }
    type Part = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
    const out: Part[] = json?.candidates?.[0]?.content?.parts ?? [];
    const img = out.find((p) => p.inlineData || p.inline_data);
    const data = img?.inlineData ?? (img?.inline_data && { mimeType: img.inline_data.mime_type, data: img.inline_data.data });
    if (data) return Response.json({ image: `data:${data.mimeType};base64,${data.data}`, model });
    lastError = json?.promptFeedback?.blockReason ? `Blocked: ${json.promptFeedback.blockReason}` : lastError;
    break;
  }
  return Response.json({ error: lastError }, { status: 502 });
}
