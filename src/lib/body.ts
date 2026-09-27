/**
 * Shared body geometry.
 *
 * Every garment is drawn in the same 400x800 "reference body" space the
 * built-in avatars use. Placing a garment on any person is then just an
 * affine map from the reference joints to that person's joints (from an
 * avatar's known geometry or from pose detection on a photo / webcam).
 */

export type Point = { x: number; y: number };

export type Joints = {
  /** Image-left / image-right shoulder joints. */
  shoulderL: Point;
  shoulderR: Point;
  hipL: Point;
  hipR: Point;
  /** Ankles are optional: photos are often cropped at the knees. */
  ankleL?: Point;
  ankleR?: Point;
};

export const REF_W = 400;
export const REF_H = 800;

export const REF_JOINTS: Required<Joints> = {
  shoulderL: { x: 140, y: 185 },
  shoulderR: { x: 260, y: 185 },
  hipL: { x: 165, y: 400 },
  hipR: { x: 235, y: 400 },
  ankleL: { x: 172, y: 720 },
  ankleR: { x: 228, y: 720 },
};

export const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const angle = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);

/** Rough joints for a centred, standing person when detection isn't available. */
export function fallbackJoints(w: number, h: number): Joints {
  const s = Math.min(w / REF_W, h / REF_H);
  const ox = (w - REF_W * s) / 2;
  const oy = (h - REF_H * s) / 2;
  const map = (p: Point) => ({ x: ox + p.x * s, y: oy + p.y * s });
  return {
    shoulderL: map(REF_JOINTS.shoulderL),
    shoulderR: map(REF_JOINTS.shoulderR),
    hipL: map(REF_JOINTS.hipL),
    hipR: map(REF_JOINTS.hipR),
    ankleL: map(REF_JOINTS.ankleL),
    ankleR: map(REF_JOINTS.ankleR),
  };
}
