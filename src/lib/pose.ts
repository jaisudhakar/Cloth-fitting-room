"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";

/**
 * In-browser pose detection (MediaPipe Pose Landmarker). The WASM runtime is
 * served from /public (scripts/copy-mediapipe.mjs); the small model file is
 * fetched once from Google's model bucket and cached by the browser. Photos
 * never leave the device for this step.
 */

export type Point = { x: number; y: number };

/** Body points in image pixels. "L"/"R" are image-left / image-right. */
export type Joints = {
  shoulderL: Point;
  shoulderR: Point;
  hipL: Point;
  hipR: Point;
  ankleL?: Point;
  ankleR?: Point;
  /** Lowest point of each foot (heel or toe), for placing shoes. */
  footL?: Point;
  footR?: Point;
  earL?: Point;
  earR?: Point;
  eyeL?: Point;
  eyeR?: Point;
  nose?: Point;
};

const WASM_BASE = "/mediapipe/wasm";
const MODEL_URL =
  process.env.NEXT_PUBLIC_POSE_MODEL_URL ??
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

let landmarker: Promise<PoseLandmarker> | null = null;

async function create(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const make = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: "IMAGE", numPoses: 1 });
  try {
    return await make("GPU");
  } catch {
    return make("CPU");
  }
}

function get() {
  if (!landmarker) {
    landmarker = create().catch((e) => {
      landmarker = null;
      throw e;
    });
  }
  return landmarker;
}

/** Start loading the detector early (e.g. when the fitting room opens). */
export function preloadPose() {
  get().catch(() => {});
}

type Landmark = { x: number; y: number; visibility?: number };

export const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Convert normalised MediaPipe landmarks into joints; null without a usable torso. */
export function toJoints(lms: Landmark[] | undefined, w: number, h: number): Joints | null {
  if (!lms || lms.length < 33) return null;
  const px = (l: Landmark): Point => ({ x: l.x * w, y: l.y * h });
  const seen = (l: Landmark, min = 0.35) => (l.visibility ?? 1) >= min && l.x > -0.05 && l.x < 1.05 && l.y > -0.05 && l.y < 1.05;
  // Sort each pair by x so "L" is always image-left, whichever way the person faces.
  const pair = (a: Landmark, b: Landmark): [Point, Point] => {
    const [p, q] = [px(a), px(b)];
    return p.x <= q.x ? [p, q] : [q, p];
  };
  if (!seen(lms[11]) || !seen(lms[12])) return null;
  const [shoulderL, shoulderR] = pair(lms[11], lms[12]);
  const sw = dist(shoulderL, shoulderR);
  if (sw < Math.min(w, h) * 0.04) return null;

  let hipL: Point, hipR: Point;
  if (seen(lms[23]) && seen(lms[24])) [hipL, hipR] = pair(lms[23], lms[24]);
  else {
    // Estimate hips from typical proportions when the photo is cropped.
    const m = mid(shoulderL, shoulderR);
    hipL = { x: m.x - sw * 0.3, y: m.y + sw * 1.75 };
    hipR = { x: m.x + sw * 0.3, y: m.y + sw * 1.75 };
  }
  const j: Joints = { shoulderL, shoulderR, hipL, hipR };
  if (seen(lms[27]) && seen(lms[28])) [j.ankleL, j.ankleR] = pair(lms[27], lms[28]);
  if (j.ankleL) {
    // Foot = lower of heel / toe on each side.
    const low = (a: Landmark, b: Landmark) => (px(a).y > px(b).y ? px(a) : px(b));
    const f1 = low(lms[29], lms[31]);
    const f2 = low(lms[30], lms[32]);
    [j.footL, j.footR] = f1.x <= f2.x ? [f1, f2] : [f2, f1];
  }
  if (seen(lms[7], 0.2) && seen(lms[8], 0.2)) [j.earL, j.earR] = pair(lms[7], lms[8]);
  if (seen(lms[2], 0.2) && seen(lms[5], 0.2)) [j.eyeL, j.eyeR] = pair(lms[2], lms[5]);
  if (seen(lms[0], 0.2)) j.nose = px(lms[0]);
  return j;
}

export async function detectPose(img: HTMLImageElement): Promise<Joints | null> {
  const lm = await get();
  const res = lm.detect(img);
  return toJoints(res.landmarks[0], img.naturalWidth, img.naturalHeight);
}

/** Proportional stand-in for a centred, standing person when detection fails. */
export function fallbackJoints(w: number, h: number): Joints {
  const s = Math.min(w / 0.75, h); // frame a 3:4 figure
  const cx = w / 2;
  const top = (h - s) / 2;
  const p = (dx: number, y: number): Point => ({ x: cx + dx * s * 0.75, y: top + y * s });
  return {
    shoulderL: p(-0.2, 0.22),
    shoulderR: p(0.2, 0.22),
    hipL: p(-0.1, 0.52),
    hipR: p(0.1, 0.52),
    ankleL: p(-0.07, 0.9),
    ankleR: p(0.07, 0.9),
    footL: p(-0.08, 0.94),
    footR: p(0.08, 0.94),
    earL: p(-0.06, 0.1),
    earR: p(0.06, 0.1),
    eyeL: p(-0.035, 0.09),
    eyeR: p(0.035, 0.09),
    nose: p(0, 0.11),
  };
}
