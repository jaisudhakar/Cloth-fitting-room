import { type Joints, REF_JOINTS, angle, dist, mid } from "./body";
import { ANCHOR_OF, type GarmentKind, SLOT_OF } from "./garments";

/** User adjustments on top of the automatic fit. */
export type Adjust = {
  dx: number;
  dy: number;
  /** Uniform scale multiplier. */
  scale: number;
  /** Extra vertical stretch (garment length). */
  length: number;
  /** Degrees. */
  rotate: number;
  opacity: number;
};

export const NO_ADJUST: Adjust = { dx: 0, dy: 0, scale: 1, length: 1, rotate: 0, opacity: 1 };

const REF_SHOULDER_W = dist(REF_JOINTS.shoulderL, REF_JOINTS.shoulderR);
const REF_HIP_W = dist(REF_JOINTS.hipL, REF_JOINTS.hipR);
const REF_TORSO = dist(mid(REF_JOINTS.shoulderL, REF_JOINTS.shoulderR), mid(REF_JOINTS.hipL, REF_JOINTS.hipR));
const REF_LEG = dist(mid(REF_JOINTS.hipL, REF_JOINTS.hipR), mid(REF_JOINTS.ankleL, REF_JOINTS.ankleR));

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * SVG transform mapping a garment drawn in reference space onto a body.
 * `sizeDelta` is how many sizes larger (+) or smaller (-) than the shopper's
 * recommended size the chosen size is; it widens or narrows the garment a bit
 * so a wrong size is visible on the model.
 */
export function fitTransform(kind: GarmentKind, body: Joints, adj: Adjust = NO_ADJUST, sizeDelta = 0) {
  const anchor = ANCHOR_OF[SLOT_OF[kind]];
  const shoulders = { a: body.shoulderL, b: body.shoulderR };
  const hips = { a: body.hipL, b: body.hipR };
  const sMid = mid(shoulders.a, shoulders.b);
  const hMid = mid(hips.a, hips.b);
  const shoulderScale = dist(shoulders.a, shoulders.b) / REF_SHOULDER_W;
  const torso = dist(sMid, hMid);
  // Keep the image-left/right convention stable if a mirrored pose swaps them.
  const tilt = (a: typeof shoulders) => {
    const t = angle(a.a, a.b);
    return Math.abs(t) > Math.PI / 2 ? t - Math.sign(t) * Math.PI : t;
  };

  let refAnchor, target, sx, sy, rot;
  if (anchor === "shoulders") {
    refAnchor = mid(REF_JOINTS.shoulderL, REF_JOINTS.shoulderR);
    target = sMid;
    sx = shoulderScale;
    sy = clamp(torso / REF_TORSO, sx * 0.8, sx * 1.3);
    rot = tilt(shoulders);
  } else {
    refAnchor = mid(REF_JOINTS.hipL, REF_JOINTS.hipR);
    target = hMid;
    // Hip joints are noisy; blend with shoulder width (and torso length) for stability.
    const hipScale = dist(hips.a, hips.b) / REF_HIP_W;
    const torsoScale = torso / REF_TORSO;
    sx = clamp(0.4 * hipScale + 0.3 * shoulderScale + 0.3 * torsoScale, shoulderScale * 0.7, shoulderScale * 1.4);
    if (body.ankleL && body.ankleR) {
      const leg = dist(hMid, mid(body.ankleL, body.ankleR));
      sy = clamp(leg / REF_LEG, sx * 0.75, sx * 1.35);
    } else {
      sy = torsoScale;
    }
    rot = tilt(hips);
  }

  const width = 1 + clamp(sizeDelta, -3, 3) * 0.045;
  const kx = sx * adj.scale * width;
  const ky = sy * adj.scale * adj.length;
  const deg = (rot * 180) / Math.PI + adj.rotate;
  return `translate(${target.x + adj.dx} ${target.y + adj.dy}) rotate(${deg}) scale(${kx} ${ky}) translate(${-refAnchor.x} ${-refAnchor.y})`;
}
