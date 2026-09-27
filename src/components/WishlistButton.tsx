"use client";

import { Heart } from "lucide-react";
import { useHydrated, useWishlist } from "@/lib/store";
import { useI18n } from "./providers/I18nProvider";

export function WishlistButton({ id, className = "" }: { id: string; className?: string }) {
  const { d } = useI18n();
  const hydrated = useHydrated();
  const on = useWishlist((s) => s.ids.includes(id)) && hydrated;
  const toggle = useWishlist((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={on}
      aria-label={on ? d.product.removeWishlist : d.product.addWishlist}
      className={`icon-btn ${className}`}
    >
      <Heart className={`size-5 ${on ? "fill-accent text-accent" : ""}`} />
    </button>
  );
}
