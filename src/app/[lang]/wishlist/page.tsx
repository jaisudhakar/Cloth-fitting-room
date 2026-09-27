"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { useI18n } from "@/components/providers/I18nProvider";
import { PRODUCTS } from "@/lib/products";
import { useHydrated, useWishlist } from "@/lib/store";

export default function WishlistPage() {
  const { d, href } = useI18n();
  const hydrated = useHydrated();
  const ids = useWishlist((s) => s.ids);
  const items = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p) => !!p);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">{d.wishlist.title}</h1>
      <div className="mt-8">
        {!hydrated ? null : items.length ? (
          <ProductGrid products={items} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line p-16 text-center">
            <Heart className="size-10 text-fg-muted" />
            <p className="max-w-sm text-fg-muted">{d.wishlist.empty}</p>
            <Link href={href("/shop")} className="btn-primary">
              {d.cart.emptyCta}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
