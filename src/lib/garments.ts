import { REF_W } from "./body";

/**
 * Procedural garment artwork.
 *
 * Garments are symmetric outlines drawn in reference-body space (see body.ts),
 * so the same SVG works as a product image and as a transparent try-on layer.
 */

export type GarmentKind =
  | "tee"
  | "shirt"
  | "sweater"
  | "hoodie"
  | "jacket"
  | "coat"
  | "dress"
  | "skirt"
  | "pants"
  | "jeans"
  | "shorts";

/** Which part of the body a garment occupies; one garment per slot. */
export type Slot = "top" | "bottom" | "onepiece" | "outer";

export const SLOT_OF: Record<GarmentKind, Slot> = {
  tee: "top",
  shirt: "top",
  sweater: "top",
  hoodie: "top",
  jacket: "outer",
  coat: "outer",
  dress: "onepiece",
  skirt: "bottom",
  pants: "bottom",
  jeans: "bottom",
  shorts: "bottom",
};

/** Draw order in the fitting room (low first). */
export const SLOT_Z: Record<Slot, number> = { bottom: 1, onepiece: 2, top: 3, outer: 4 };

/** Tops and dresses hang from the shoulders; bottoms sit on the hips. */
export const ANCHOR_OF: Record<Slot, "shoulders" | "hips"> = {
  top: "shoulders",
  outer: "shoulders",
  onepiece: "shoulders",
  bottom: "hips",
};

type P = [number, number];

type Shape = {
  /** Right-half outline, from the neck/waist edge round to the hem corner. */
  right: P[];
  /** y of the neckline (or waistband) curve's control point at the centre. */
  topDip: number;
  /** y of the hem curve's control point at the centre. */
  hemDip: number;
};

const SHORT_SLEEVE: P[] = [
  [225, 170],
  [262, 178],
  [302, 246],
  [274, 266],
  [260, 236],
];

const LONG_SLEEVE: P[] = [
  [225, 170],
  [264, 177],
  [284, 192],
  [310, 320],
  [322, 446],
  [284, 452],
  [270, 330],
  [260, 240],
];

const SHAPES: Record<GarmentKind, Shape> = {
  tee: { right: [...SHORT_SLEEVE, [264, 425]], topDip: 194, hemDip: 432 },
  shirt: { right: [...LONG_SLEEVE, [266, 440]], topDip: 200, hemDip: 452 },
  sweater: { right: [...LONG_SLEEVE, [262, 430]], topDip: 190, hemDip: 436 },
  hoodie: { right: [...LONG_SLEEVE, [266, 440]], topDip: 196, hemDip: 446 },
  jacket: {
    right: [
      [228, 166],
      [270, 176],
      [290, 192],
      [316, 320],
      [328, 450],
      [286, 458],
      [274, 330],
      [266, 240],
      [272, 455],
    ],
    topDip: 206,
    hemDip: 462,
  },
  coat: {
    right: [
      [228, 166],
      [272, 176],
      [292, 192],
      [318, 320],
      [330, 452],
      [288, 460],
      [276, 330],
      [268, 240],
      [284, 580],
    ],
    topDip: 210,
    hemDip: 586,
  },
  dress: {
    right: [
      [222, 172],
      [250, 176],
      [258, 190],
      [254, 238],
      [246, 330],
      [300, 625],
    ],
    topDip: 196,
    hemDip: 636,
  },
  skirt: { right: [[246, 330], [262, 400], [292, 560]], topDip: 332, hemDip: 568 },
  pants: {
    right: [[246, 335], [264, 410], [260, 560], [252, 738], [206, 738], [203, 445]],
    topDip: 336,
    hemDip: 443,
  },
  jeans: {
    right: [[246, 335], [264, 410], [258, 560], [250, 738], [208, 738], [203, 445]],
    topDip: 336,
    hemDip: 443,
  },
  shorts: {
    right: [[246, 335], [264, 410], [268, 525], [206, 528], [203, 448]],
    topDip: 336,
    hemDip: 446,
  },
};

const mirror = ([x, y]: P): P => [REF_W - x, y];
const pt = ([x, y]: P) => `${x},${y}`;

function outline({ right, topDip, hemDip }: Shape) {
  const first = right[0];
  const last = right[right.length - 1];
  const leftBack = right.slice(0, -1).reverse().map(mirror);
  return [
    `M${pt(mirror(first))}`,
    `Q200,${topDip} ${pt(first)}`,
    ...right.slice(1).map((p) => `L${pt(p)}`),
    `Q200,${hemDip} ${pt(mirror(last))}`,
    ...leftBack.map((p) => `L${pt(p)}`),
    "Z",
  ].join(" ");
}

function bounds(kind: GarmentKind, pad = 14) {
  const shape = SHAPES[kind];
  const xs = shape.right.flatMap(([x]) => [x, REF_W - x]);
  const ys = [...shape.right.map(([, y]) => y), shape.topDip, shape.hemDip];
  // Hoods and collars rise above the neckline.
  const minY = Math.min(...ys) - (kind === "hoodie" ? 40 : 30);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum > 170;
}

function details(kind: GarmentKind, c: string) {
  const line = shade(c, isLight(c) ? -0.28 : 0.22);
  const deep = shade(c, -0.35);
  const sw = (w: number) => `stroke="${line}" fill="none" stroke-width="${w}" stroke-linecap="round"`;
  const s = sw(2.2);
  const dash = `stroke="${line}" fill="none" stroke-width="1.6" stroke-dasharray="4 4"`;
  switch (kind) {
    case "tee":
      return `<path d="M175,170 Q200,194 225,170" ${sw(5)}/>
        <path d="M140,414 Q200,421 260,414" ${dash}/>
        <path d="M110,244 L132,258 M290,244 L268,258" ${dash}/>`;
    case "sweater":
      return `<path d="M175,170 Q200,190 225,170" ${sw(8)}/>
        <path d="M138,418 Q200,425 262,418" ${sw(10)} stroke-opacity=".45"/>
        <path d="M86,436 L118,440 M282,440 L314,436" ${sw(8)} stroke-opacity=".45"/>
        ${[150, 170, 190, 210, 230, 250].map((x) => `<path d="M${x},${240 + Math.abs(x - 200) / 3} L${x},${400}" stroke="${line}" stroke-width="1" stroke-opacity=".35"/>`).join("")}`;
    case "shirt":
      return `<path d="M175,170 L200,204 L225,170 L232,160 L214,196 M175,170 L168,160 L186,196" fill="${shade(c, 0.1)}" stroke="${line}" stroke-width="2"/>
        <path d="M200,204 L200,446" ${s}/>
        ${[228, 272, 316, 360, 404].map((y) => `<circle cx="206" cy="${y}" r="3.2" fill="${line}"/>`).join("")}
        <path d="M222,250 h26 v24 h-26 z" ${sw(1.6)}/>
        <path d="M84,436 L118,442 M282,442 L316,436" ${s}/>`;
    case "hoodie":
      return `<path d="M154,186 Q152,146 200,144 Q248,146 246,186 Q224,176 200,176 Q176,176 154,186 Z M180,172 Q182,154 200,154 Q218,154 220,172 Q200,166 180,172 Z" fill="${deep}" fill-rule="evenodd" stroke="${line}" stroke-width="2"/>
        <path d="M178,178 Q200,196 222,178" ${sw(3)}/>
        <path d="M190,190 L187,250 M210,190 L213,250" stroke="${shade(c, 0.5)}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M156,330 L244,330 L262,410 L138,410 Z" ${s}/>
        <path d="M138,430 Q200,438 262,430" ${sw(8)} stroke-opacity=".45"/>
        <path d="M86,440 L118,446 M282,446 L314,440" ${sw(8)} stroke-opacity=".45"/>`;
    case "jacket":
      return `<path d="M172,166 L200,262 L228,166 L246,176 L214,258 L200,262 L186,258 L154,176 Z" fill="${deep}" stroke="${line}" stroke-width="2"/>
        <path d="M200,262 L200,458" stroke="${shade(c, 0.45)}" stroke-width="3"/>
        <path d="M150,380 h30 M220,380 h30" ${s}/>
        <path d="M142,446 Q200,454 258,446" ${dash}/>
        <path d="M86,442 L126,450 M274,450 L314,442" ${s}/>`;
    case "coat":
      return `<path d="M170,166 L200,290 L230,166 L252,178 L216,286 L200,290 L184,286 L148,178 Z" fill="${deep}" stroke="${line}" stroke-width="2"/>
        <path d="M200,290 L206,586" ${s}/>
        ${[330, 400, 470].map((y) => `<circle cx="222" cy="${y}" r="5" fill="${line}"/><circle cx="178" cy="${y}" r="5" fill="${line}"/>`).join("")}
        <path d="M140,440 h40 M220,440 h40" ${s}/>
        <path d="M150,330 Q200,336 250,330" ${sw(6)} stroke-opacity=".4"/>
        <path d="M86,446 L128,454 M272,454 L314,446" ${s}/>`;
    case "dress":
      return `<path d="M178,172 Q200,196 222,172" ${sw(3)}/>
        <path d="M154,330 Q200,338 246,330" ${sw(5)}/>
        ${[160, 185, 215, 240].map((x) => `<path d="M${200 + (x - 200) * 0.9},340 Q${200 + (x - 200) * 1.3},480 ${200 + (x - 200) * 1.9},620" stroke="${line}" fill="none" stroke-width="1.4" stroke-opacity=".5"/>`).join("")}`;
    case "skirt":
      return `<path d="M154,330 Q200,334 246,330 L248,344 Q200,348 152,344 Z" fill="${deep}"/>
        ${[165, 185, 215, 235].map((x) => `<path d="M${x},346 L${200 + (x - 200) * 2},560" stroke="${line}" stroke-width="1.4" stroke-opacity=".5"/>`).join("")}`;
    case "pants":
      return `<path d="M154,336 Q200,340 246,336 L247,352 Q200,356 153,352 Z" fill="${deep}"/>
        <path d="M200,356 L200,440" ${s}/>
        <path d="M230,360 Q246,380 258,378 M170,360 Q154,380 142,378" ${s}/>
        <path d="M233,450 L230,735 M167,450 L170,735" stroke="${line}" stroke-width="1.2" stroke-opacity=".6"/>`;
    case "jeans":
      return `<path d="M154,336 Q200,340 246,336 L247,352 Q200,356 153,352 Z" fill="${deep}"/>
        <path d="M200,356 L200,440 M206,356 Q208,410 200,430" stroke="#d9a441" fill="none" stroke-width="1.6" stroke-dasharray="4 3"/>
        <path d="M226,358 Q244,382 260,380 M174,358 Q156,382 140,380" stroke="#d9a441" fill="none" stroke-width="1.6" stroke-dasharray="4 3"/>
        <path d="M258,420 L250,735 M142,420 L150,735" stroke="#d9a441" fill="none" stroke-width="1.4" stroke-dasharray="4 3" stroke-opacity=".8"/>
        <circle cx="200" cy="344" r="3.4" fill="#d9a441"/>`;
    case "shorts":
      return `<path d="M154,336 Q200,340 246,336 L247,352 Q200,356 153,352 Z" fill="${deep}"/>
        <path d="M200,356 L200,440" ${s}/>
        <path d="M232,360 Q246,380 258,378 M168,360 Q154,380 142,378" ${s}/>
        <path d="M206,514 L266,512 M194,514 L134,512" ${dash}/>`;
  }
}

export type GarmentSvgOptions = {
  kind: GarmentKind;
  color: string;
  /** Solid backdrop colour for catalogue images; omit for transparent try-on layers. */
  background?: string;
};

export function garmentViewBox(kind: GarmentKind) {
  return bounds(kind);
}

export function garmentSvg({ kind, color, background }: GarmentSvgOptions) {
  const shape = SHAPES[kind];
  const vb = bounds(kind);
  const body = outline(shape);
  const edge = shade(color, isLight(color) ? -0.2 : 0.12);
  const id = `g${kind}${color.slice(1)}`;
  // Catalogue images get a square canvas so product cards line up.
  const side = Math.max(vb.w, vb.h) * 1.12;
  const view = background
    ? { x: vb.x + vb.w / 2 - side / 2, y: vb.y + vb.h / 2 - side / 2, w: side, h: side }
    : vb;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.x} ${view.y} ${view.w} ${view.h}" width="${Math.round(view.w * 2)}" height="${Math.round(view.h * 2)}">
<defs>
<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#000" stop-opacity=".22"/>
<stop offset=".22" stop-color="#000" stop-opacity="0"/>
<stop offset=".5" stop-color="#fff" stop-opacity=".08"/>
<stop offset=".78" stop-color="#000" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity=".22"/>
</linearGradient>
</defs>
${background ? `<rect x="${view.x}" y="${view.y}" width="${view.w}" height="${view.h}" fill="${background}"/>` : ""}
${background ? `<ellipse cx="200" cy="${vb.y + vb.h - 6}" rx="${vb.w * 0.38}" ry="10" fill="#000" opacity=".07"/>` : ""}
<path d="${body}" fill="${color}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>
<path d="${body}" fill="url(#${id})"/>
${details(kind, color)}
</svg>`;
}

const cache = new Map<string, string>();

export function garmentDataUrl(opts: GarmentSvgOptions) {
  const key = `${opts.kind}|${opts.color}|${opts.background ?? ""}`;
  let url = cache.get(key);
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(garmentSvg(opts))}`;
    cache.set(key, url);
  }
  return url;
}
