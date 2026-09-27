"use client";

import type { Layer, Product } from "./catalog";
import { type Adjust, placeGarment } from "./fit";
import type { Joints } from "./pose";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/** Re-encode an uploaded photo (whole frame, EXIF-rotated) with its long side capped at `max`. */
export async function readPhoto(file: File, max = 2000) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return scaleImage(img, max);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function scaleImage(img: HTMLImageElement, max: number, type = "image/jpeg") {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { src: canvas.toDataURL(type, 0.92), w: canvas.width, h: canvas.height };
}

/** Flatten the photo and fitted garments into one PNG, exactly as shown on screen. */
export async function renderComposite(
  base: { src: string; w: number; h: number },
  joints: Joints,
  items: { layer: Layer; product: Product }[],
  adjust: Partial<Record<Layer, Adjust>>,
) {
  const canvas = document.createElement("canvas");
  canvas.width = base.w;
  canvas.height = base.h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(await loadImage(base.src), 0, 0, base.w, base.h);
  const placed = items.map((it) => ({ ...it, p: placeGarment(it.layer, it.product, joints, adjust[it.layer]) })).sort((a, b) => a.p.z - b.p.z);
  for (const { product, p } of placed) {
    const img = await loadImage(product.image);
    const [bx, by, bw, bh] = product.bbox;
    const ox = p.left + p.width * p.origin[0];
    const oy = p.top + p.height * p.origin[1];
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate((p.rotate * Math.PI) / 180);
    // Same soft drop shadow as the on-screen preview.
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = Math.max(4, p.width * 0.012);
    ctx.shadowOffsetY = Math.max(2, p.width * 0.008);
    ctx.drawImage(img, bx * img.naturalWidth, by * img.naturalHeight, bw * img.naturalWidth, bh * img.naturalHeight, p.left - ox, p.top - oy, p.width, p.height);
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
}
