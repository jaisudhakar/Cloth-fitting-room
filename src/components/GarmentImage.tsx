/* eslint-disable @next/next/no-img-element -- inline SVG data URLs gain nothing from next/image */
import { garmentDataUrl, type GarmentKind } from "@/lib/garments";
import { CARD_BG } from "@/lib/products";

export function GarmentImage({
  kind,
  color,
  alt,
  className = "",
  transparent = false,
}: {
  kind: GarmentKind;
  color: string;
  alt: string;
  className?: string;
  transparent?: boolean;
}) {
  return (
    <img
      src={garmentDataUrl({ kind, color, background: transparent ? undefined : CARD_BG })}
      alt={alt}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}
