"use client";

import { Shirt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { t, type Product } from "@/lib/products";
import { GarmentImage } from "./GarmentImage";
import { Price, Rating } from "./Price";
import { useI18n } from "./providers/I18nProvider";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product: p }: { product: Product }) {
  const { lang, d, f, href } = useI18n();
  const [color, setColor] = useState(p.colors[0]);
  const name = t(p.name, lang);
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const url = href(`/product/${p.slug}?color=${encodeURIComponent(color.hex)}`);
  return (
    <article className="group relative flex flex-col" data-testid="product-card">
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <Link href={url} aria-label={name}>
          <GarmentImage
            kind={p.kind}
            color={color.hex}
            alt={`${name} — ${t(color.name, lang)}`}
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">{f(d.product.sale, { n: off })}</span>}
          {p.tags.includes("new") && <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold">{d.product.new}</span>}
          {p.tags.includes("bestseller") && !off && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-fg">{d.product.bestseller}</span>
          )}
        </div>
        <WishlistButton id={p.id} className="absolute end-2 top-2 bg-surface/80 backdrop-blur" />
        <Link
          href={href(`/fitting-room?product=${p.slug}&color=${encodeURIComponent(color.hex)}`)}
          className="btn absolute inset-x-3 bottom-3 h-10 translate-y-2 bg-surface/95 text-fg opacity-0 shadow-sm backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100"
        >
          <Shirt className="size-4" />
          {d.product.tryOn}
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium leading-snug">
            <Link href={url} className="hover:underline">
              {name}
            </Link>
          </h3>
          <Price price={p.price} compareAt={p.compareAt} className="shrink-0 text-sm" />
        </div>
        <Rating value={p.rating} />
        <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label={d.product.color}>
          {p.colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={c.hex === color.hex}
              aria-label={t(c.name, lang)}
              title={t(c.name, lang)}
              onClick={() => setColor(c)}
              className="size-5 rounded-full border border-black/10 ring-offset-2 ring-offset-bg transition aria-checked:ring-2 aria-checked:ring-fg"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
