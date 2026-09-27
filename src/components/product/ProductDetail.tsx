"use client";

import {
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconBrandX,
  IconLink,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconStar,
  IconStarFilled,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryById, onSale, productById, relatedProducts, t } from "@/lib/catalog";
import { useCart, useUi } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { Breadcrumbs } from "../shop/PromoCarousel";
import { Button } from "../ui/Button";
import { Reveal } from "../ui/Reveal";
import { ProductCard, TryOnButton, WishButton, defaultVariant } from "./ProductCard";

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        value >= n - 0.25 ? (
          <IconStarFilled key={n} size={size} className="text-[var(--primaryColor)]" />
        ) : (
          <IconStar key={n} size={size} stroke={1.4} className="text-[var(--text-muted)]/50" />
        ),
      )}
    </span>
  );
}

/** Square product shot that magnifies under the pointer. */
function Zoomable({ src, alt }: { src: string; alt: string }) {
  const [origin, setOrigin] = useState<string | null>(null);
  return (
    <div
      className="relative h-full w-full cursor-zoom-in overflow-hidden"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onPointerLeave={() => setOrigin(null)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 540px"
        className="object-contain p-8 transition-transform duration-300 ease-out"
        style={{ transform: origin ? "scale(1.7)" : "scale(1)", transformOrigin: origin ?? "center" }}
      />
    </div>
  );
}

export function ProductDetail({ productId }: { productId: number }) {
  const { d, f, lang, href, price } = useI18n();
  const router = useRouter();
  const p = productById(productId)!;
  const add = useCart((s) => s.add);
  const showToast = useUi((s) => s.showToast);
  const def = defaultVariant(p);
  const [color, setColor] = useState(def.color);
  const [size, setSize] = useState(def.size);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews">("description");
  const cat = categoryById(p.categoryId);
  const name = t(p.name, lang);
  const colorLabel = p.colors.find((c) => c.value === color);

  const addToCart = () => {
    add(p.id, { color, size, qty });
    showToast(d.product.added);
  };

  return (
    <div className="mx-auto max-w-[1256px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: d.nav.shop, href: href("/shop") }, ...(cat ? [{ label: t(cat.name, lang), href: href(`/shop?category=${cat.slug}`) }] : []), { label: name }]} />
      <div className="rounded-[2rem] bg-[var(--surface-elevated)] p-4 sm:p-8 md:p-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[var(--background)] lg:sticky lg:top-24 lg:self-start"
          >
            <Zoomable src={p.image} alt={name} />
            <div className="absolute start-5 top-5 z-10 flex flex-col gap-3">
              <WishButton product={p} className="!h-11 !w-11 bg-[var(--surface-elevated)] shadow-sm" />
              <TryOnButton product={p} className="!h-11 !w-11 !opacity-100 shadow-sm" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {cat && <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{t(cat.name, lang)}</p>}
                <h1 className="mt-3 max-w-md text-3xl font-semibold leading-[1.1] text-[var(--text)] sm:text-[2.25rem]">{name}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="me-1 hidden sm:inline">{d.product.shareOn}</span>
                {[
                  { Icon: IconBrandFacebook, label: "Facebook", url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
                  { Icon: IconBrandX, label: "X", url: (u: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(name)}` },
                  { Icon: IconBrandWhatsapp, label: "WhatsApp", url: (u: string) => `https://wa.me/?text=${encodeURIComponent(`${name} ${u}`)}` },
                ].map(({ Icon, url, label }) => (
                  // The page URL is only known in the browser, so build the share link on click.
                  <button
                    key={label}
                    type="button"
                    onClick={() => window.open(url(window.location.href), "_blank", "noopener,noreferrer")}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] transition-colors hover:border-[var(--primaryColor)] hover:text-[var(--primaryColor)]"
                  >
                    <Icon size={14} stroke={1.6} />
                  </button>
                ))}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast(d.product.copied);
                  }}
                  aria-label="Copy link"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] transition-colors hover:border-[var(--primaryColor)] hover:text-[var(--primaryColor)]"
                >
                  <IconLink size={14} stroke={1.6} />
                </button>
              </div>
            </div>
            <p className="mt-6 text-[15px] text-[var(--text-muted)]">{t(p.description, lang)}</p>
            <div className="mt-5 flex items-center gap-3">
              <Stars value={p.rating} />
              <button onClick={() => setTab("reviews")} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                {f(d.product.reviewsCount, { n: p.reviewCount })}
              </button>
            </div>

            <div className="my-6 h-px bg-[var(--border)]" />
            <div className="flex items-baseline gap-3">
              <span className="text-[2.25rem] font-semibold text-[var(--text)]">{price(p.price, true)}</span>
              {onSale(p) && <span className="text-lg text-[var(--text-muted)] line-through">{price(p.compareAtPrice!, true)}</span>}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{d.product.taxes}</p>
            <div className="my-6 h-px bg-[var(--border)]" />

            {p.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {d.product.chooseColor} <span className="ms-1 font-normal text-[var(--text-muted)]">{colorLabel && t(colorLabel.label, lang)}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup" aria-label={d.product.chooseColor}>
                  {p.colors.map((c) => (
                    <button
                      key={c.value}
                      role="radio"
                      aria-checked={c.value === color}
                      aria-label={t(c.label, lang)}
                      title={t(c.label, lang)}
                      disabled={c.stock === 0}
                      onClick={() => setColor(c.value)}
                      className="h-10 w-10 rounded-full border border-black/10 ring-offset-2 ring-offset-[var(--surface-elevated)] transition-transform hover:scale-110 disabled:opacity-30 aria-checked:ring-2 aria-checked:ring-[var(--primaryColor)]"
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
            {p.sizes.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-[var(--text)]">{d.product.selectSize}</p>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={d.product.selectSize}>
                  {p.sizes.map((s) => (
                    <button
                      key={s.value}
                      role="radio"
                      aria-checked={s.value === size}
                      disabled={s.stock === 0}
                      onClick={() => setSize(s.value)}
                      className="flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--border)] px-3 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--text-muted)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]/50 disabled:line-through aria-checked:border-[var(--primaryColor)] aria-checked:text-[var(--primaryColor)]"
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="my-6 h-px bg-[var(--border)]" />

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-[3.25rem] items-center rounded-full border border-[var(--border)] bg-[var(--background)]">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-full w-12 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="-">
                  <IconMinus size={16} />
                </button>
                <span className="w-10 text-center tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))} className="flex h-full w-12 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="+">
                  <IconPlus size={16} />
                </button>
              </div>
              {p.stock > 0 && p.stock <= 20 ? (
                <div>
                  <p className="text-sm font-semibold text-[var(--accent-text)]">{f(d.product.onlyLeft, { n: p.stock })}</p>
                  <p className="text-xs text-[var(--text-muted)]">{d.product.dontMiss}</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--success)]">{p.stock > 0 ? d.product.inStock : d.product.outOfStock}</p>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-[3.25rem]"
                disabled={p.stock === 0}
                onClick={() => {
                  add(p.id, { color, size, qty });
                  router.push(href("/checkout"));
                }}
              >
                {d.product.buyNow}
              </Button>
              <Button size="lg" variant="outline" className="h-[3.25rem]" disabled={p.stock === 0} onClick={addToCart} data-testid="add-to-cart">
                {d.product.addToCart}
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--text-muted)]">
              {[IconTruckDelivery, IconRefresh, IconShieldCheck].map((Icon, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Icon size={15} stroke={1.6} className="text-[var(--primaryColor)]" />
                  {d.product.perks[i]}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-16">
          <div className="flex gap-2 border-b border-[var(--border)]" role="tablist">
            {(["description", "reviews"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative px-3 pb-3 text-[15px] ${tab === k ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
                {k === "description" ? d.product.description : d.product.reviews}
                {k === "reviews" && <span className="ms-2 rounded-full bg-[var(--surface-hover)] px-1.5 py-0.5 text-[11px]">{p.reviewCount}</span>}
                {tab === k && <motion.span layoutId="pdp-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--primaryColor)]" />}
              </button>
            ))}
          </div>
          {tab === "description" ? (
            <div className="prose-product mt-8">
              <h3 className="!mt-0">{d.product.productDescription}</h3>
              <div dangerouslySetInnerHTML={{ __html: t(p.longDescription, lang) }} />
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
              <div className="text-center sm:w-48">
                <p className="text-5xl font-semibold">{p.rating.toFixed(1)}</p>
                <div className="mt-2 flex justify-center">
                  <Stars value={p.rating} />
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{f(d.product.basedOn, { n: p.reviewCount })}</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  // Spread of ratings consistent with the average.
                  const w = Math.max(0, 1 - Math.abs(star - p.rating) / 2.2);
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-3 text-[var(--text-muted)]">{star}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                        <motion.div className="h-full rounded-full bg-[var(--primaryColor)]" initial={{ width: 0 }} animate={{ width: `${w * 100}%` }} transition={{ duration: 0.8, delay: (5 - star) * 0.06 }} />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-2 text-sm text-[var(--text-muted)]">{d.product.noReviews}</p>
              </div>
            </div>
          )}
        </div>

        <Reveal className="mt-16">
          <h2 className="mb-8 text-2xl font-semibold text-[var(--text)]">{d.product.youMayAlsoLike}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {relatedProducts(p).map((r, i) => (
              <div key={r.id} className="rounded-[1.5rem] shadow-[0_4px_24px_-12px_rgba(16,16,20,0.18)]">
                <ProductCard product={r} index={i} decimals />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
