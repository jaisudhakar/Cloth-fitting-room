"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { type Layer, type Product, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";

export const MODEL_IMAGE = "/assets/images/tryon/model-man.jpg";

/**
 * Where each layer sits on the mannequin photo (597×800), as a box in percent
 * of the frame. Garments are fitted inside the box by their measured visible
 * area, so a cut-out's transparent margin never shrinks it.
 */
const BOX: Record<Layer, { x: number; y: number; w: number; h: number; z: number; anchor: "top" | "bottom" }> = {
  headwear: { x: 39, y: 2.5, w: 22, h: 11.5, z: 50, anchor: "bottom" },
  top: { x: 26.5, y: 19, w: 47, h: 30, z: 30, anchor: "top" },
  outerwear: { x: 24.5, y: 18, w: 51, h: 40, z: 40, anchor: "top" },
  bottom: { x: 33, y: 40.5, w: 34, h: 52, z: 20, anchor: "top" },
  footwear: { x: 32, y: 86.5, w: 36, h: 10.5, z: 10, anchor: "bottom" },
};

const FRAME = 597 / 800;

/** Garment positioned so its visible area fills its layer box (object-fit: contain on the bbox). */
function Garment({ product, layer }: { product: Product; layer: Layer }) {
  const { lang } = useI18n();
  const box = BOX[layer];
  const [bx, by, bw, bh] = product.bbox;
  // Compare aspect ratios in frame units: box width is % of width, height % of height.
  const boxAspect = (box.w * FRAME) / box.h;
  const garmentAspect = bw / bh;
  const wPct = garmentAspect > boxAspect ? box.w : (box.h * garmentAspect) / FRAME;
  const hPct = (wPct * FRAME) / garmentAspect;
  const left = box.x + (box.w - wPct) / 2;
  const top = box.anchor === "top" ? box.y : box.y + box.h - hPct;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="absolute overflow-hidden"
      style={{ left: `${left}%`, top: `${top}%`, width: `${wPct}%`, height: `${hPct}%`, zIndex: box.z }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- positioned by bbox, next/image adds nothing */}
      <img
        src={product.image}
        alt={t(product.name, lang)}
        draggable={false}
        className="absolute max-w-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
        style={{ width: `${100 / bw}%`, height: `${100 / bh}%`, left: `${(-bx / bw) * 100}%`, top: `${(-by / bh) * 100}%` }}
      />
    </motion.div>
  );
}

export function ModelCanvas({ equipped, className = "" }: { equipped: { layer: Layer; product: Product }[]; className?: string }) {
  return (
    <div className={`relative aspect-[597/800] overflow-hidden rounded-2xl bg-[#8e9092] ${className}`} data-testid="model-canvas">
      <Image src={MODEL_IMAGE} alt="" fill sizes="(max-width: 640px) 80vw, 400px" className="object-cover" priority={false} />
      <AnimatePresence>
        {equipped.map(({ layer, product }) => (
          <Garment key={`${layer}-${product.id}`} layer={layer} product={product} />
        ))}
      </AnimatePresence>
    </div>
  );
}
