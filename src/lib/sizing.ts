export type FitPref = "snug" | "regular" | "relaxed";

export type Measurements = { height: number; weight: number; fit: FitPref };

const ALPHA = ["XS", "S", "M", "L", "XL", "XXL"];

export const SIZE_CHART = [
  { size: "XS", waist: "28", chest: "82–86", waistCm: "66–70", hips: "88–92" },
  { size: "S", waist: "30", chest: "87–92", waistCm: "71–76", hips: "93–97" },
  { size: "M", waist: "32", chest: "93–99", waistCm: "77–82", hips: "98–103" },
  { size: "L", waist: "34", chest: "100–106", waistCm: "83–89", hips: "104–109" },
  { size: "XL", waist: "36", chest: "107–113", waistCm: "90–96", hips: "110–115" },
  { size: "XXL", waist: "38", chest: "114–120", waistCm: "97–103", hips: "116–121" },
];

/** Continuous size index on the XS(0)…XXL(5) scale. */
function sizeScore({ height, weight, fit }: Measurements) {
  const bmi = weight / (height / 100) ** 2;
  let score = (bmi - 18.5) / 3;
  if (height >= 185) score += 0.6;
  else if (height <= 160) score -= 0.5;
  score += fit === "snug" ? -0.35 : fit === "relaxed" ? 0.55 : 0;
  return Math.max(0, Math.min(ALPHA.length - 1, score));
}

/** Index into a product's `sizes` array. Works for alpha (XS–XXL) and waist (28–38) runs alike. */
function indexIn(sizes: string[], idx: number) {
  return Math.max(0, Math.min(sizes.length - 1, idx));
}

export function recommendSize(sizes: string[], m: Measurements) {
  const score = sizeScore(m);
  const idx = indexIn(sizes, Math.round(score));
  // How close the score sits to the centre of its size band.
  const confidence = Math.round(96 - Math.abs(score - Math.round(score)) * 40);
  return { size: sizes[idx], index: idx, confidence };
}

/** Chosen size minus recommended size, in size steps (used to widen/narrow the try-on overlay). */
export function sizeDelta(sizes: string[], chosen: string, m: Measurements | null) {
  if (!m) return 0;
  const rec = recommendSize(sizes, m).index;
  const i = sizes.indexOf(chosen);
  return i < 0 ? 0 : i - rec;
}
