import type { Layer, Product } from "./catalog";
import { type Joints, type Point, dist, mid } from "./pose";

/**
 * Fits a flat-lay garment cut-out onto a body.
 *
 * Every measurement is relative to the shoulder span (`sw`, distance between
 * the shoulder joints), so the same rules work for the demo mannequin and for
 * any customer photo, at any resolution.
 */

export type Placement = {
  /** Pixel rect of the garment's visible area in the photo, before rotation. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Degrees, around `origin`. */
  rotate: number;
  /** Rotation origin as fractions of the rect ("50% 0%" = top centre). */
  origin: [number, number];
  z: number;
};

/** Manual nudges on top of the automatic fit, relative to the shoulder span. */
export type Adjust = { dx: number; dy: number; scale: number };
export const NO_ADJUST: Adjust = { dx: 0, dy: 0, scale: 1 };

const Z: Record<Layer, number> = { footwear: 10, bottom: 20, top: 30, outerwear: 40, headwear: 50 };

/** Body points of the demo mannequin photo (597×800), measured with the same pose model. */
export const MODEL_SIZE = { w: 597, h: 800 };
export const MODEL_JOINTS: Joints = {
  shoulderL: { x: 237, y: 189 },
  shoulderR: { x: 338, y: 195 },
  hipL: { x: 270, y: 395 },
  hipR: { x: 320, y: 391 },
  ankleL: { x: 275, y: 703 },
  ankleR: { x: 327, y: 705 },
  footL: { x: 268, y: 731 },
  footR: { x: 330, y: 729 },
  eyeL: { x: 294, y: 99 },
  eyeR: { x: 307, y: 99 },
  nose: { x: 300, y: 110 },
};

const angleDeg = (a: Point, b: Point) => {
  let t = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (t > 90) t -= 180;
  if (t < -90) t += 180;
  // Clamp: a garment should follow a tilted pose, not flip over.
  return Math.max(-35, Math.min(35, t));
};

export function placeGarment(layer: Layer, product: Pick<Product, "bbox">, j: Joints, adj: Adjust = NO_ADJUST): Placement {
  const [, , bw, bh] = product.bbox;
  const aspect = bh / bw; // visible height / width of the cut-out
  const sMid = mid(j.shoulderL, j.shoulderR);
  const hMid = mid(j.hipL, j.hipR);
  const sw = Math.max(1, dist(j.shoulderL, j.shoulderR));
  const tilt = angleDeg(j.shoulderL, j.shoulderR);
  let p: Placement;

  switch (layer) {
    case "top":
    case "outerwear": {
      // Flat-lay tops include spread sleeves, so they are about twice the shoulder span.
      const width = sw * (layer === "top" ? 2.15 : 2.4);
      const height = width * aspect;
      const top = sMid.y - sw * (layer === "top" ? 0.2 : 0.24);
      p = { left: sMid.x - width / 2, top, width, height, rotate: tilt, origin: [0.5, 0], z: Z[layer] };
      break;
    }
    case "bottom": {
      const width = sw * 1.35;
      const waist = hMid.y - sw * 0.5;
      const natural = width * aspect;
      let height = natural;
      if (j.ankleL && j.ankleR) {
        // Stretch (a little) so the hems reach the ankles.
        const target = mid(j.ankleL, j.ankleR).y + sw * 0.1 - waist;
        height = Math.max(natural * 0.8, Math.min(natural * 1.3, target));
      }
      p = { left: hMid.x - width / 2, top: waist, width, height, rotate: angleDeg(j.hipL, j.hipR) * 0.5, origin: [0.5, 0], z: Z.bottom };
      break;
    }
    case "footwear": {
      const fl = j.footL ?? j.ankleL;
      const fr = j.footR ?? j.ankleR;
      const center = fl && fr ? mid(fl, fr) : { x: hMid.x, y: hMid.y + sw * 3.1 };
      const span = fl && fr ? Math.abs(fr.x - fl.x) : sw * 0.6;
      // Follow the stance, but never wider than a normal pair (wide poses would blow shoes up).
      const width = Math.min(sw * 1.8, Math.max(sw * 1.4, span + sw * 0.75));
      const height = width * aspect;
      const bottom = center.y + sw * 0.06;
      p = { left: center.x - width / 2, top: bottom - height, width, height, rotate: 0, origin: [0.5, 1], z: Z.footwear };
      break;
    }
    case "headwear": {
      const eyes = j.eyeL && j.eyeR ? mid(j.eyeL, j.eyeR) : j.nose ? { x: j.nose.x, y: j.nose.y - sw * 0.1 } : { x: sMid.x, y: sMid.y - sw * 0.9 };
      const width = sw * 0.82;
      const height = width * aspect;
      const bottom = eyes.y - sw * 0.06;
      p = { left: eyes.x - width / 2, top: bottom - height, width, height, rotate: tilt, origin: [0.5, 1], z: Z.headwear };
      break;
    }
  }

  // Manual adjustment: scale around the anchor edge, then move.
  const s = adj.scale;
  const ax = p.left + p.width * p.origin[0];
  const ay = p.top + p.height * p.origin[1];
  const width = p.width * s;
  const height = p.height * s;
  return {
    ...p,
    width,
    height,
    left: ax - width * p.origin[0] + adj.dx * sw,
    top: ay - height * p.origin[1] + adj.dy * sw,
  };
}

/** Shoulder span in pixels, the unit for manual nudges. */
export const shoulderSpan = (j: Joints) => Math.max(1, dist(j.shoulderL, j.shoulderR));
