"use client";

import { ChevronDown, Minus, Plus, Ruler, Shirt, ShoppingBag, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AVATARS } from "@/lib/avatars";
import { SLOT_OF, type GarmentKind } from "@/lib/garments";
import { PRODUCTS, completeTheLook, productById, relatedProducts, t } from "@/lib/products";
import { recommendSize, sizeDelta } from "@/lib/sizing";
import { useCart, useHydrated, useProfile, useUi } from "@/lib/store";
import { GarmentImage } from "../GarmentImage";
import { OutfitPreview } from "../OutfitPreview";
import { Price, Rating } from "../Price";
import { ProductGrid } from "../ProductCard";
import { useI18n } from "../providers/I18nProvider";
import { SizeAdvisor } from "../SizeAdvisor";
import { WishlistButton } from "../WishlistButton";

/** A neutral base so tops and bottoms don't show on a bare model in the gallery. */
function galleryOutfit(kind: GarmentKind, color: string) {
  const slot = SLOT_OF[kind];
  const pieces: { kind: GarmentKind; color: string }[] = [{ kind, color }];
  if (slot === "top" || slot === "outer") pieces.unshift({ kind: "pants", color: "#3b3f45" });
  if (slot === "bottom") pieces.push({ kind: "tee", color: "#ece8e1" });
  if (slot === "outer") pieces.splice(1, 0, { kind: "tee", color: "#ece8e1" });
  return pieces;
}

export function ProductDetail({ productId }: { productId: string }) {
  const { d, f, lang, href, price } = useI18n();
  const sp = useSearchParams();
  const p = productById(productId)!;
  const [color, setColor] = useState(p.colors.find((c) => c.hex === sp.get("color")) ?? p.colors[0]);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [advisor, setAdvisor] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [open, setOpen] = useState<string | null>("details");
  const hydrated = useHydrated();
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const showToast = useUi((s) => s.showToast);
  const measurements = useProfile((s) => s.measurements);
  const recent = useProfile((s) => s.recent);
  const markViewed = useProfile((s) => s.view);

  useEffect(() => markViewed(p.id), [p.id, markViewed]);

  const rec = hydrated && measurements ? recommendSize(p.sizes, measurements) : null;
  const delta = size && hydrated ? sizeDelta(p.sizes, size, measurements) : 0;
  const name = t(p.name, lang);
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const recentProducts = hydrated
    ? recent.filter((id) => id !== p.id).map(productById).filter((x): x is (typeof PRODUCTS)[number] => !!x).slice(0, 4)
    : [];
  const views = [
    { key: "flat", el: <GarmentImage kind={p.kind} color={color.hex} alt={name} className="size-full object-contain" /> },
    ...AVATARS.slice(0, 3).map((a) => ({
      key: a.id,
      el: <OutfitPreview avatar={a} pieces={galleryOutfit(p.kind, color.hex)} className="size-full" label={`${name} — ${a.name[lang]}`} />,
    })),
  ];

  const addToCart = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    add(p.id, color.hex, size, qty);
    showToast(d.product.added);
    setCartOpen(true);
  };

  const sections = [
    { id: "details", title: d.product.details, body: t(p.description, lang) },
    { id: "materials", title: d.product.materials, body: t(p.material, lang) },
    { id: "shipping", title: d.product.shipping, body: d.product.shippingText },
  ];

  return (
    <div className="container-x py-8">
      <nav className="mb-6 text-sm text-fg-muted" aria-label="Breadcrumb">
        <Link href={href("/")} className="hover:text-fg">{d.nav.home}</Link>
        <span className="mx-2">/</span>
        <Link href={href(`/shop?category=${p.category}`)} className="hover:text-fg">{d.category[p.category]}</Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex gap-4 max-sm:flex-col-reverse">
          <div className="flex gap-3 sm:flex-col">
            {views.map((v, i) => (
              <button
                key={v.key}
                onClick={() => setView(i)}
                aria-label={`${i + 1}`}
                aria-pressed={view === i}
                className="size-20 overflow-hidden rounded-xl bg-muted ring-offset-2 ring-offset-bg aria-pressed:ring-2 aria-pressed:ring-fg"
              >
                {v.el}
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
            {views[view].el}
            {off > 0 && (
              <span className="absolute start-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-fg">{f(d.product.sale, { n: off })}</span>
            )}
            <Link
              href={href(`/fitting-room?product=${p.slug}&color=${encodeURIComponent(color.hex)}${size ? `&size=${size}` : ""}`)}
              className="btn absolute bottom-4 end-4 bg-surface/95 shadow-md backdrop-blur hover:bg-surface"
            >
              <Sparkles className="size-4 text-accent" />
              {d.product.tryOn}
            </Link>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              {p.tags.includes("new") && <p className="eyebrow mb-2 text-accent">{d.product.new}</p>}
              <h1 className="font-display text-3xl sm:text-4xl">{name}</h1>
            </div>
            <WishlistButton id={p.id} className="border border-line" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Price price={p.price} compareAt={p.compareAt} className="text-xl" />
            <Rating value={p.rating} count={p.reviews} />
          </div>

          <div className="mt-8">
            <p className="text-sm">
              {d.product.color}: <span className="font-medium">{t(color.name, lang)}</span>
            </p>
            <div className="mt-3 flex gap-2.5" role="radiogroup" aria-label={d.product.color}>
              {p.colors.map((c) => (
                <button
                  key={c.hex}
                  role="radio"
                  aria-checked={c.hex === color.hex}
                  aria-label={t(c.name, lang)}
                  onClick={() => setColor(c)}
                  className="size-9 rounded-full border border-black/10 ring-offset-2 ring-offset-bg aria-checked:ring-2 aria-checked:ring-fg"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <p>
                {d.product.size}
                {rec && <span className="ms-2 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">{f(d.product.recommended, { size: rec.size })}</span>}
              </p>
              <button className="inline-flex items-center gap-1.5 text-fg-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setAdvisor(true)}>
                <Ruler className="size-4" />
                {rec ? d.product.sizeGuide : d.product.findSize}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2" role="radiogroup" aria-label={d.product.size}>
              {p.sizes.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                  }}
                  className={`relative h-11 rounded-xl border text-sm transition aria-checked:border-fg aria-checked:bg-primary aria-checked:text-primary-fg ${
                    sizeError ? "border-danger" : "border-line hover:border-fg"
                  }`}
                >
                  {s}
                  {rec?.size === s && <span className="absolute -top-1 end-1 size-2 rounded-full bg-success" />}
                </button>
              ))}
            </div>
            {sizeError && <p className="mt-2 text-sm text-danger" role="alert">{d.product.selectSize}</p>}
            {size && measurements && hydrated && (
              <p className={`mt-2 text-sm ${delta === 0 ? "text-success" : "text-fg-muted"}`}>
                {delta < 0 ? d.size.tight : delta > 0 ? d.size.loose : d.size.perfect}
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <div className="inline-flex h-12 items-center rounded-full border border-line">
              <button className="icon-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center tabular-nums" aria-label={d.product.quantity}>{qty}</span>
              <button className="icon-btn" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="+">
                <Plus className="size-4" />
              </button>
            </div>
            <button className="btn-primary h-12 flex-1" onClick={addToCart} data-testid="add-to-cart">
              <ShoppingBag className="size-4" />
              {d.product.addToCart} · {price(p.price * qty)}
            </button>
          </div>

          <Link
            href={href(`/fitting-room?product=${p.slug}&color=${encodeURIComponent(color.hex)}${size ? `&size=${size}` : ""}`)}
            className="mt-3 flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/5 p-4 transition hover:bg-accent/10"
            data-testid="try-on-link"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
              <Shirt className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{d.product.tryOn}</span>
              <span className="block text-sm text-fg-muted">{d.product.tryOnHint}</span>
            </span>
          </Link>

          <p className="mt-6 flex items-center gap-2 text-sm text-fg-muted">
            <Truck className="size-4" /> {d.product.inStock}
          </p>

          <div className="mt-8 divide-y divide-line border-y border-line">
            {sections.map((s) => (
              <div key={s.id}>
                <button
                  className="flex w-full items-center justify-between py-4 text-start font-medium"
                  aria-expanded={open === s.id}
                  onClick={() => setOpen(open === s.id ? null : s.id)}
                >
                  {s.title}
                  <ChevronDown className={`size-4 transition ${open === s.id ? "rotate-180" : ""}`} />
                </button>
                {open === s.id && <p className="pb-4 text-sm leading-relaxed text-fg-muted">{s.body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="mb-8 font-display text-3xl">{d.product.completeLook}</h2>
        <ProductGrid products={completeTheLook(p)} />
      </section>
      <section className="mt-20">
        <h2 className="mb-8 font-display text-3xl">{d.product.related}</h2>
        <ProductGrid products={relatedProducts(p)} />
      </section>
      {recentProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-3xl">{d.product.recentlyViewed}</h2>
          <ProductGrid products={recentProducts} />
        </section>
      )}

      <SizeAdvisor
        open={advisor}
        onClose={() => setAdvisor(false)}
        sizes={p.sizes}
        onPick={(s) => {
          setSize(s);
          setSizeError(false);
        }}
      />
    </div>
  );
}
