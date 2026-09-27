/**
 * "Draw the look": sends the mannequin (or the customer's own photo) plus the picked garments to
 * Google's Gemini image model and returns the composite.
 *
 * With the store's GEMINI_API_KEY set, the fitting room renders every outfit
 * automatically. Otherwise a shopper can supply their own key (x-goog-api-key),
 * as in the reference demo. Images are read from public/ by slug, so the client
 * can't make the server fetch arbitrary URLs.
 *
 * Cost control for the store key: finished looks are cached (mannequin looks
 * also on disk, since every visitor shares them) and each visitor is limited
 * to a handful of fresh renders per window.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Layer, LAYERS, layerOf, productBySlug } from "@/lib/catalog";

export const runtime = "nodejs";
export const maxDuration = 120;

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = [process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image", "gemini-2.5-flash-image"];
const PUBLIC = join(process.cwd(), "public");
const MODEL_IMAGE = "/assets/images/tryon/model-man.jpg";
const CACHE_DIR = join(process.cwd(), ".cache", "looks");
const LIMIT = Number(process.env.TRYON_RENDERS_PER_WINDOW ?? 20);
const WINDOW_MS = 10 * 60 * 1000;

/** Recently rendered looks, newest last. */
const memory = new Map<string, string>();
function remember(key: string, image: string) {
  memory.delete(key);
  memory.set(key, image);
  while (memory.size > 60) memory.delete(memory.keys().next().value!);
}

/** Fresh renders per visitor on the store's key. */
const usage = new Map<string, number[]>();
function allow(ip: string) {
  const now = Date.now();
  const recent = (usage.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  usage.set(ip, recent);
  return true;
}

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

/** The whole point of the demo: the worn garment must be the product, not a lookalike. */
const EXACT =
  "Each garment must match its reference image EXACTLY: same colour and shade, fabric and texture, pattern, prints, graphics and logos, buttons, zips, pockets, collar, cuffs, seams and length. Do not add, remove or restyle any design detail.";

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
      EXACT,
    "Requirements: keep the person's face, hair, skin tone, body proportions, pose, framing, camera angle, lighting and background exactly as in IMAGE 1. Replace only the clothing the new garments cover; keep everything else. Garments drape naturally over the body in 3D with realistic folds and shadows, never a flat pasted cut-out. Keep each garment's exact colour, pattern and material. Same aspect ratio as IMAGE 1. No text, watermarks or extra people.",
    ].join("\n");
  }
  return [
    "Virtual fitting-room composite, photorealistic studio photography.",
    "IMAGE 1 is the base figure: a matte light-grey full-body male display mannequin, frontal pose, plain grey studio backdrop.",
    garmentList[0],
    "Render ONE photograph of that SAME mannequin (identical body, frontal pose, camera, lighting and background) now DRESSED in these garments worn together as one outfit:",
    garmentList[1],
    EXACT,
    "Requirements: full body visible from head to feet, nothing cropped. Garments wrap the body in 3D with natural folds and drape, never a flat pasted cut-out. Respect the layering order. Keep each garment's exact colour, pattern and material. Plain studio background. No text, watermarks, props or extra people. Portrait 3:4.",
  ].join("\n");
}

// Customer photos arrive as data URLs; the client downsizes them to ~1280px.
const PHOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_CHARS = 8_000_000;

/** Tells the client whether looks render automatically on the store's key. */
export async function GET() {
  return Response.json({ serverKey: !!process.env.GEMINI_API_KEY });
}

export async function POST(req: Request) {
  const own = req.headers.get("x-goog-api-key")?.trim();
  const key = own || process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "Add your Google AI key first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { garments?: unknown; person?: unknown; fresh?: unknown } | null;
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

  // Same outfit on the same person → same look. Mannequin looks are shared by all visitors.
  const cacheKey = createHash("sha256")
    .update(JSON.stringify({ g: garments.map((g) => g.image), p: person ? createHash("sha256").update(person.inline_data.data).digest("hex") : "model" }))
    .digest("hex");
  const diskFile = person ? null : join(CACHE_DIR, `${cacheKey}.txt`);
  if (body?.fresh !== true) {
    const hit = memory.get(cacheKey) ?? (diskFile ? await readFile(diskFile, "utf8").catch(() => null) : null);
    if (hit) {
      remember(cacheKey, hit);
      return Response.json({ image: hit, cached: true });
    }
  }
  if (!own) {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
    if (!allow(ip)) return Response.json({ error: "You've drawn a lot of looks. Try again in a few minutes." }, { status: 429 });
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
    if (data) {
      const image = `data:${data.mimeType};base64,${data.data}`;
      remember(cacheKey, image);
      if (diskFile) await mkdir(CACHE_DIR, { recursive: true }).then(() => writeFile(diskFile, image)).catch(() => {});
      return Response.json({ image, model });
    }
    lastError = json?.promptFeedback?.blockReason ? `Blocked: ${json.promptFeedback.blockReason}` : lastError;
    break;
  }
  return Response.json({ error: lastError }, { status: 502 });
}
