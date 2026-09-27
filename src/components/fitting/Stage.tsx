"use client";

import { forwardRef, useRef } from "react";
import type { Joints } from "@/lib/body";
import { fitTransform } from "@/lib/fit";
import { SLOT_Z, type Slot, garmentDataUrl, garmentViewBox } from "@/lib/garments";
import { productById } from "@/lib/products";
import { sizeDelta, type Measurements } from "@/lib/sizing";
import type { Worn } from "@/lib/store";

export type StageLayer = { slot: Slot; worn: Worn };

/** Build the list of garments to draw, bottom-most first. */
export function stageLayers(outfit: Partial<Record<Slot, Worn>>): StageLayer[] {
  return (Object.entries(outfit) as [Slot, Worn][])
    .filter(([, w]) => !!w && !!productById(w.productId))
    .sort(([a], [b]) => SLOT_Z[a] - SLOT_Z[b])
    .map(([slot, worn]) => ({ slot, worn }));
}

/** SVG markup for the garments; shared by the live stage and the PNG export. */
export function layerTransform(l: StageLayer, joints: Joints, m: Measurements | null) {
  const p = productById(l.worn.productId)!;
  return fitTransform(p.kind, joints, l.worn.adjust, sizeDelta(p.sizes, l.worn.size, m));
}

export function exportSvg(opts: {
  width: number;
  height: number;
  background: string;
  layers: StageLayer[];
  joints: Joints;
  measurements: Measurements | null;
}) {
  const { width, height, background, layers, joints, measurements } = opts;
  const body = layers
    .map((l) => {
      const p = productById(l.worn.productId)!;
      const vb = garmentViewBox(p.kind);
      const href = garmentDataUrl({ kind: p.kind, color: l.worn.color });
      return `<g transform="${layerTransform(l, joints, measurements)}" opacity="${l.worn.adjust.opacity}"><image href="${href}" x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}"/></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="${background}" width="${width}" height="${height}"/>${body}</svg>`;
}

type Props = {
  width: number;
  height: number;
  /** Image drawn behind the garments (avatar/photo). Omit when a <video> sits behind the stage. */
  background?: string;
  video?: React.ReactNode;
  joints: Joints | null;
  layers: StageLayer[];
  measurements: Measurements | null;
  selected: Slot | null;
  onSelect: (slot: Slot | null) => void;
  onMove: (slot: Slot, dx: number, dy: number) => void;
  hideGarments?: boolean;
  mirrored?: boolean;
  label: string;
};

export const Stage = forwardRef<HTMLDivElement, Props>(function Stage(
  { width, height, background, video, joints, layers, measurements, selected, onSelect, onMove, hideGarments, mirrored, label },
  ref,
) {
  const drag = useRef<{ slot: Slot; x: number; y: number; k: number } | null>(null);

  const start = (slot: Slot) => (e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    onSelect(slot);
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    drag.current = { slot, x: e.clientX, y: e.clientY, k: width / rect.width };
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) * d.k * (mirrored ? -1 : 1);
    const dy = (e.clientY - d.y) * d.k;
    d.x = e.clientX;
    d.y = e.clientY;
    if (dx || dy) onMove(d.slot, dx, dy);
  };
  const end = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      className="relative mx-auto max-h-[78vh] overflow-hidden rounded-3xl bg-muted shadow-inner"
      style={{ aspectRatio: `${width} / ${height}`, transform: mirrored ? "scaleX(-1)" : undefined }}
    >
      {video}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 size-full touch-none select-none"
        role="img"
        aria-label={label}
        onPointerDown={() => onSelect(null)}
        data-testid="stage"
      >
        {background && <image href={background} width={width} height={height} />}
        {joints &&
          !hideGarments &&
          layers.map((l) => {
            const p = productById(l.worn.productId)!;
            const vb = garmentViewBox(p.kind);
            const t = layerTransform(l, joints, measurements);
            const isSel = selected === l.slot;
            return (
              <g
                key={l.slot}
                transform={t}
                opacity={l.worn.adjust.opacity}
                onPointerDown={start(l.slot)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className="cursor-grab active:cursor-grabbing"
                data-testid={`layer-${l.slot}`}
                data-transform={t}
              >
                <image href={garmentDataUrl({ kind: p.kind, color: l.worn.color })} x={vb.x} y={vb.y} width={vb.w} height={vb.h} />
                {isSel && (
                  <rect
                    x={vb.x}
                    y={vb.y}
                    width={vb.w}
                    height={vb.h}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray="8 6"
                    vectorEffect="non-scaling-stroke"
                    rx={12}
                  />
                )}
              </g>
            );
          })}
      </svg>
    </div>
  );
});
