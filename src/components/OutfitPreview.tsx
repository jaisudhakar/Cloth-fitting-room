import { type Avatar, avatarDataUrl, avatarJoints } from "@/lib/avatars";
import { REF_H, REF_W } from "@/lib/body";
import { fitTransform } from "@/lib/fit";
import { SLOT_OF, SLOT_Z, garmentDataUrl, garmentViewBox, type GarmentKind } from "@/lib/garments";

/** A static avatar dressed in the given garments (hero images, fitting-room teaser). */
export function OutfitPreview({
  avatar,
  pieces,
  className = "",
  label,
}: {
  avatar: Avatar;
  pieces: { kind: GarmentKind; color: string }[];
  className?: string;
  label: string;
}) {
  const body = avatarJoints(avatar);
  const sorted = [...pieces].sort((a, b) => SLOT_Z[SLOT_OF[a.kind]] - SLOT_Z[SLOT_OF[b.kind]]);
  return (
    <svg viewBox={`0 0 ${REF_W} ${REF_H}`} className={className} role="img" aria-label={label}>
      <image href={avatarDataUrl(avatar)} width={REF_W} height={REF_H} />
      {sorted.map((p) => {
        const vb = garmentViewBox(p.kind);
        return (
          <g key={p.kind} transform={fitTransform(p.kind, body)}>
            <image href={garmentDataUrl(p)} x={vb.x} y={vb.y} width={vb.w} height={vb.h} />
          </g>
        );
      })}
    </svg>
  );
}
