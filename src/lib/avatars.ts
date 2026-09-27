import { type Joints, type Point, REF_H, REF_JOINTS, REF_W } from "./body";

/**
 * Built-in fitting-room models. Each is drawn procedurally in reference-body
 * space with a width multiplier, so its joints are known exactly and garments
 * fit without any pose detection.
 */

export type Avatar = {
  id: string;
  name: { en: string; ar: string };
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bun" | "curly";
  /** Horizontal build multiplier around the centre line. */
  build: number;
  backdrop: [string, string];
};

export const AVATARS: Avatar[] = [
  { id: "maya", name: { en: "Maya", ar: "مايا" }, skin: "#f1c9a5", hair: "#3b2416", hairStyle: "long", build: 0.94, backdrop: ["#f4efe9", "#e6ddd2"] },
  { id: "leo", name: { en: "Leo", ar: "ليو" }, skin: "#8d5524", hair: "#1b1410", hairStyle: "short", build: 1.1, backdrop: ["#eef1f4", "#d9e0e7"] },
  { id: "aisha", name: { en: "Aisha", ar: "عائشة" }, skin: "#c68642", hair: "#231510", hairStyle: "bun", build: 1.0, backdrop: ["#f5eef0", "#e8d9de"] },
  { id: "kai", name: { en: "Kai", ar: "كاي" }, skin: "#e0ac69", hair: "#4a2c1a", hairStyle: "curly", build: 1.05, backdrop: ["#eef3ee", "#d9e4da"] },
];

const scaleX = (p: Point, k: number): Point => ({ x: 200 + (p.x - 200) * k, y: p.y });

export function avatarJoints(a: Avatar): Joints {
  const k = a.build;
  return {
    shoulderL: scaleX(REF_JOINTS.shoulderL, k),
    shoulderR: scaleX(REF_JOINTS.shoulderR, k),
    hipL: scaleX(REF_JOINTS.hipL, k),
    hipR: scaleX(REF_JOINTS.hipR, k),
    ankleL: scaleX(REF_JOINTS.ankleL, k),
    ankleR: scaleX(REF_JOINTS.ankleR, k),
  };
}

function hair(a: Avatar) {
  const c = a.hair;
  switch (a.hairStyle) {
    case "short":
      return `<path d="M158,92 Q156,40 200,38 Q246,40 242,92 Q236,62 200,60 Q166,62 158,92 Z" fill="${c}"/>`;
    case "long":
      return `<path d="M156,96 Q150,36 200,36 Q252,36 244,96 L250,200 Q236,212 226,196 L232,90 Q222,62 200,62 Q176,62 168,90 L174,196 Q164,212 150,200 Z" fill="${c}"/>`;
    case "bun":
      return `<circle cx="200" cy="34" r="22" fill="${c}"/><path d="M158,94 Q154,44 200,42 Q246,44 242,94 Q234,64 200,62 Q166,64 158,94 Z" fill="${c}"/>`;
    case "curly":
      return `<g fill="${c}">${[
        [164, 70], [178, 52], [200, 46], [222, 52], [236, 70], [160, 92], [240, 92],
      ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17"/>`).join("")}</g>`;
  }
}

export function avatarSvg(a: Avatar) {
  const k = a.build;
  const X = (x: number) => 200 + (x - 200) * k;
  const skin = a.skin;
  const limb = (pts: [number, number][], w: number) =>
    `<polyline points="${pts.map(([x, y]) => `${X(x)},${y}`).join(" ")}" fill="none" stroke="${skin}" stroke-width="${w * k}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const torso = `M${X(146)},200 Q${X(128)},190 ${X(132)},236 L${X(156)},330 L${X(142)},400 L${X(258)},400 L${X(244)},330 L${X(268)},236 Q${X(272)},190 ${X(254)},200 Z`;
  const base = "#9aa0a6";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${REF_W} ${REF_H}" width="${REF_W * 2}" height="${REF_H * 2}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.backdrop[0]}"/><stop offset="1" stop-color="${a.backdrop[1]}"/></linearGradient></defs>
<rect width="${REF_W}" height="${REF_H}" fill="url(#bg)"/>
<ellipse cx="200" cy="756" rx="${110 * k}" ry="14" fill="#000" opacity=".08"/>
${limb([[140, 185], [112, 320], [100, 440]], 36)}
${limb([[260, 185], [288, 320], [300, 440]], 36)}
<circle cx="${X(99)}" cy="452" r="${15 * k}" fill="${skin}"/><circle cx="${X(301)}" cy="452" r="${15 * k}" fill="${skin}"/>
${limb([[172, 400], [170, 560], [172, 724]], 52)}
${limb([[228, 400], [230, 560], [228, 724]], 52)}
<ellipse cx="${X(166)}" cy="738" rx="${22 * k}" ry="10" fill="#3a3a3a"/><ellipse cx="${X(234)}" cy="738" rx="${22 * k}" ry="10" fill="#3a3a3a"/>
<rect x="186" y="128" width="28" height="50" rx="10" fill="${skin}"/>
<path d="${torso}" fill="${skin}"/>
<path d="M${X(150)},214 L${X(250)},214 L${X(244)},330 L${X(156)},330 Z" fill="${base}" opacity=".9"/>
<path d="M${X(152)},362 L${X(248)},362 L${X(262)},430 L${X(208)},440 L200,420 L${X(192)},440 L${X(138)},430 Z" fill="${base}" opacity=".9"/>
${a.hairStyle === "long" ? hair(a) : ""}
<ellipse cx="200" cy="92" rx="40" ry="50" fill="${skin}"/>
${a.hairStyle === "long" ? `<path d="M160,92 Q158,50 200,48 Q244,50 240,92 Q226,66 200,66 Q174,66 160,92 Z" fill="${a.hair}"/>` : hair(a)}
<g fill="#2b2b2b" opacity=".75"><ellipse cx="185" cy="96" rx="3.2" ry="4"/><ellipse cx="215" cy="96" rx="3.2" ry="4"/></g>
<path d="M190,118 Q200,125 210,118" stroke="#8a4b3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</svg>`;
}

const cache = new Map<string, string>();

export function avatarDataUrl(a: Avatar) {
  let url = cache.get(a.id);
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(a))}`;
    cache.set(a.id, url);
  }
  return url;
}
