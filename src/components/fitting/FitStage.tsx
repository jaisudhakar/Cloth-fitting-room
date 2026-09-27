"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { type Layer, type Product, t } from "@/lib/catalog";
import { type Adjust, MODEL_JOINTS, MODEL_SIZE, NO_ADJUST, placeGarment, shoulderSpan } from "@/lib/fit";
import type { Joints } from "@/lib/pose";
import { useI18n } from "../I18nProvider";

export const MODEL_IMAGE = "/assets/images/tryon/model-man.jpg";
export const MODEL_BASE = { src: MODEL_IMAGE, ...MODEL_SIZE };

export type StageItem = { layer: Layer; product: Product };

type Props = {
  base: { src: string; w: number; h: number };
  joints: Joints;
  items: StageItem[];
  adjust: Partial<Record<Layer, Adjust>>;
  /** Drag to move, tap to select. */
  editable?: boolean;
  selected?: Layer | null;
  onSelect?: (layer: Layer | null) => void;
  onNudge?: (layer: Layer, patch: Partial<Adjust>) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The person (mannequin or customer photo) shown whole, at its own aspect
 * ratio, with each garment fitted to the detected body points.
 */
export function FitStage({ base, joints, items, adjust, editable, selected, onSelect, onNudge, className = "", style }: Props) {
  const { lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ layer: Layer; x: number; y: number; start: Adjust } | null>(null);
  const sw = shoulderSpan(joints);

  const onDown = (layer: Layer) => (e: React.PointerEvent) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(layer);
    drag.current = { layer, x: e.clientX, y: e.clientY, start: adjust[layer] ?? NO_ADJUST };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    // Screen pixels → photo pixels → shoulder spans.
    const k = base.w / el.getBoundingClientRect().width;
    onNudge?.(d.layer, { dx: d.start.dx + ((e.clientX - d.x) * k) / sw, dy: d.start.dy + ((e.clientY - d.y) * k) / sw });
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl bg-[#8e9092] ${editable ? "touch-none select-none" : ""} ${className}`}
      style={{ aspectRatio: `${base.w} / ${base.h}`, ...style }}
      onPointerDown={() => editable && onSelect?.(null)}
      data-testid="fit-stage"
      dir="ltr"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- photo may be a local data URL */}
      <img src={base.src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-fill" />
      <AnimatePresence>
        {items.map(({ layer, product }) => {
          const p = placeGarment(layer, product, joints, adjust[layer]);
          const [bx, by, bw, bh] = product.bbox;
          const isSel = editable && selected === layer;
          return (
            <motion.div
              key={`${layer}-${product.id}`}
              initial={{ opacity: 0, y: -12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={`absolute ${editable ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
              style={{
                left: `${(p.left / base.w) * 100}%`,
                top: `${(p.top / base.h) * 100}%`,
                width: `${(p.width / base.w) * 100}%`,
                height: `${(p.height / base.h) * 100}%`,
                zIndex: p.z,
                rotate: `${p.rotate}deg`,
                transformOrigin: `${p.origin[0] * 100}% ${p.origin[1] * 100}%`,
              }}
              onPointerDown={onDown(layer)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              data-testid={`garment-${layer}`}
            >
              <div className="absolute inset-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- cropped to the garment's visible area */}
                <img
                  src={product.image}
                  alt={t(product.name, lang)}
                  draggable={false}
                  className="absolute max-w-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.28)]"
                  style={{ width: `${100 / bw}%`, height: `${100 / bh}%`, left: `${(-bx / bw) * 100}%`, top: `${(-by / bh) * 100}%` }}
                />
              </div>
              {isSel && <span className="pointer-events-none absolute -inset-1 rounded-lg border-2 border-dashed border-[var(--primaryColor)]" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export { MODEL_JOINTS };
