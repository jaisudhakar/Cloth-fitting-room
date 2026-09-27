"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { type Joints, type Point, dist, mid } from "./body";

/**
 * In-browser pose detection (MediaPipe Pose Landmarker). The WASM runtime is
 * served from /public (see scripts/copy-mediapipe.mjs); the model is fetched
 * once from Google's model bucket and cached by the browser.
 */

const WASM_BASE = "/mediapipe/wasm";
const MODEL_URL =
  process.env.NEXT_PUBLIC_POSE_MODEL_URL ??
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Mode = "IMAGE" | "VIDEO";

let landmarker: Promise<PoseLandmarker> | null = null;
let mode: Mode = "IMAGE";

async function create(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const make = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "IMAGE",
      numPoses: 1,
    });
  try {
    return await make("GPU");
  } catch {
    return make("CPU");
  }
}

async function get(want: Mode) {
  if (!landmarker) {
    landmarker = create().catch((e) => {
      landmarker = null;
      throw e;
    });
  }
  const lm = await landmarker;
  if (mode !== want) {
    await lm.setOptions({ runningMode: want });
    mode = want;
  }
  return lm;
}

/** Start downloading the model early (e.g. when the fitting room opens). */
export function preloadPose() {
  get("IMAGE").catch(() => {});
}

type Landmark = { x: number; y: number; visibility?: number };

const SEEN = 0.35;

/** Convert normalised landmarks into image-space joints; null if no usable torso. */
function toJoints(lms: Landmark[] | undefined, w: number, h: number): Joints | null {
  if (!lms || lms.length < 29) return null;
  const px = (l: Landmark): Point => ({ x: l.x * w, y: l.y * h });
  const seen = (l: Landmark) => (l.visibility ?? 1) >= SEEN && l.x > -0.05 && l.x < 1.05 && l.y > -0.05 && l.y < 1.05;
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
  if (seen(lms[23]) && seen(lms[24])) {
    [hipL, hipR] = pair(lms[23], lms[24]);
  } else {
    // Estimate hips below the shoulders using typical proportions.
    const m = mid(shoulderL, shoulderR);
    const down = sw * 1.75;
    hipL = { x: m.x - sw * 0.3, y: m.y + down };
    hipR = { x: m.x + sw * 0.3, y: m.y + down };
  }

  const joints: Joints = { shoulderL, shoulderR, hipL, hipR };
  if (seen(lms[27]) && seen(lms[28])) {
    [joints.ankleL, joints.ankleR] = pair(lms[27], lms[28]);
  }
  return joints;
}

export async function detectImage(img: HTMLImageElement): Promise<Joints | null> {
  const lm = await get("IMAGE");
  const res = lm.detect(img);
  return toJoints(res.landmarks[0], img.naturalWidth, img.naturalHeight);
}

export async function videoDetector() {
  const lm = await get("VIDEO");
  let last = -1;
  return (video: HTMLVideoElement, now: number): Joints | null => {
    // Timestamps must strictly increase.
    const ts = Math.max(now, last + 1);
    last = ts;
    const res = lm.detectForVideo(video, ts);
    return toJoints(res.landmarks[0], video.videoWidth, video.videoHeight);
  };
}

/** Exponential smoothing for live video so garments don't jitter. */
export function smoothJoints(prev: Joints | null, next: Joints | null, a = 0.45): Joints | null {
  if (!next) return prev;
  if (!prev) return next;
  const s = (p: Point, n: Point) => ({ x: p.x + (n.x - p.x) * a, y: p.y + (n.y - p.y) * a });
  return {
    shoulderL: s(prev.shoulderL, next.shoulderL),
    shoulderR: s(prev.shoulderR, next.shoulderR),
    hipL: s(prev.hipL, next.hipL),
    hipR: s(prev.hipR, next.hipR),
    ankleL: next.ankleL && (prev.ankleL ? s(prev.ankleL, next.ankleL) : next.ankleL),
    ankleR: next.ankleR && (prev.ankleR ? s(prev.ankleR, next.ankleR) : next.ankleR),
  };
}
