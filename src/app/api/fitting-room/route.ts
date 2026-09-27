/**
 * "Draw the look": sends the mannequin (or the customer's own photo) plus the picked garments to
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

function prompt(garments: { name: string; layer: Layer }[], customer: boolean) {
  const garmentList = [
    garments.map((g, i) => `IMAGE ${i + 2} is ${g.name}.`).join(" "),
    garments.map((g) => `- ${g.name}, ${WEAR[g.layer]}`).join("\n"),
  ];
  if (customer) {
    return [
      "Virtual try-on, photorealistic.",
      "IMAGE 1 is a photo of the customer.",
      garmentList[0],
      "Edit IMAGE 1 so the SAME person is wearing these garments together as one outfit, fitted to their body shape, size and pose:",
      garmentList[1],
      "Requirements: keep the person's face, hair, skin tone, body proportions, pose, framing, camera angle, lighting and background exactly as in IMAGE 1. Replace only the clothing the new garments cover; keep everything else. Garments drape naturally over the body in 3D with realistic folds and shadows, never a flat pasted cut-out. Keep each garment's exact colour, pattern and material. Same aspect ratio as IMAGE 1. No text, watermarks or extra people.",
    ].join("\n");
  }
  return [
    "Virtual fitting-room composite, photorealistic studio photography.",
    "IMAGE 1 is the base figure: a matte light-grey full-body male display mannequin, frontal pose, plain grey studio backdrop.",
    garmentList[0],
    "Render ONE photograph of that SAME mannequin (identical body, frontal pose, camera, lighting and background) now DRESSED in these garments worn together as one outfit:",
    garmentList[1],
    "Requirements: full body visible from head to feet, nothing cropped. Garments wrap the body in 3D with natural folds and drape, never a flat pasted cut-out. Respect the layering order. Keep each garment's exact colour, pattern and material. Plain studio background. No text, watermarks, props or extra people. Portrait 3:4.",
  ].join("\n");
}

// Customer photos arrive as data URLs; the client downsizes them to ~1280px.
const PHOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_CHARS = 8_000_000;

export async function POST(req: Request) {
  const key = req.headers.get("x-goog-api-key")?.trim() || process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Add your Google AI key first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { garments?: unknown; person?: unknown } | null;
  const slugs = Array.isArray(body?.garments) ? body.garments.filter((s): s is string => typeof s === "string").slice(0, 5) : [];
  const products = slugs.map(productBySlug).filter((p) => !!p);
  if (!products.length) return Response.json({ error: "Pick at least one garment." }, { status: 400 });

  const garments = products
    .map((p) => ({ name: p.name.en, layer: layerOf(p), image: p.image }))
    .sort((a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));

  let person: { inline_data: { mime_type: string; data: string } } | null = null;
  if (body?.person !== undefined) {
    const m = typeof body.person === "string" && body.person.length < MAX_PHOTO_CHARS ? PHOTO.exec(body.person) : null;
    if (!m) return Response.json({ error: "That photo can't be used. Try a JPG or PNG." }, { status: 400 });
    person = { inline_data: { mime_type: m[1], data: m[2] } };
  }

  let parts;
  try {
    parts = [
      { text: prompt(garments, !!person) },
      person ?? (await inline(MODEL_IMAGE)),
      ...(await Promise.all(garments.map((g) => inline(g.image)))),
    ];
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
        // A customer photo keeps its own framing; the mannequin is always portrait.
        generationConfig: { responseModalities: ["IMAGE"], ...(person ? {} : { imageConfig: { aspectRatio: "3:4" } }) },
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
