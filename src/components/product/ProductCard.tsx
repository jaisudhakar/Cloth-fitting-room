"use client";

import { IconHanger, IconHeart, IconHeartFilled, IconShoppingBagPlus, IconStarFilled } from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { layerOf, onSale, type Product, t } from "@/lib/catalog";
import { useCart, useFitting, useHydrated, useUi, useWishlist } from "@/lib/store";
import { useI18n } from "../I18nProvider";

/** Default variant for one-tap adds: first colour and first size in stock. */
export function defaultVariant(p: Product) {
  return {
    color: p.colors.find((c) => c.stock > 0)?.value ?? p.colors[0]?.value,
    size: p.sizes.find((s) => s.stock > 0)?.value ?? p.sizes[0]?.value,
  };
}

export function WishButton({ product, className = "" }: { product: Product; className?: string }) {
  const { d } = useI18n();
  const hydrated = useHydrated();
  const on = useWishlist((s) => s.ids.includes(product.id)) && hydrated;
  const toggle = useWishlist((s) => s.toggle);
  return (
    <button
      type="button"
      aria-label={on ? d.product.removeFromWishlist : d.product.addToWishlist}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        toggle(product.id);
      }}
      className={`group/wish relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)] transition-colors hover:bg-[var(--primaryColor)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)] max-sm:h-7 max-sm:w-7 ${className}`}
    >
      <IconHeart size={18} stroke={1.6} className="max-sm:h-[15px] max-sm:w-[15px]" />
      {/* Filled heart wipes up from the bottom when saved. */}
      <span
        className="absolute inset-0 flex items-center justify-center text-[var(--primaryColor)] transition-[clip-path,color] duration-500 ease-out group-hover/wish:text-white"
        style={{ clipPath: on ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)" }}
      >
        <IconHeartFilled size={18} className="max-sm:h-[15px] max-sm:w-[15px]" />
      </span>
    </button>
  );
}

export function TryOnButton({ product, className = "" }: { product: Product; className?: string }) {
  const { d } = useI18n();
  const hydrated = useHydrated();
  const worn = useFitting((s) => s.equipped[layerOf(product)] === product.id) && hydrated;
  const toggle = useFitting((s) => s.toggle);
  const showToast = useUi((s) => s.showToast);
  return (
    <button
      type="button"
      aria-label={d.product.tryOn}
      aria-pressed={worn}
      onClick={(e) => {
        e.preventDefault();
        showToast(toggle(product.id) === "added" ? d.fitting.added : d.fitting.removed);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-[opacity,background-color,color] hover:bg-[var(--primaryColor)] hover:text-white focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)] max-sm:h-7 max-sm:w-7 [@media(hover:none)]:opacity-100 ${
        worn ? "bg-[var(--primaryColor)] text-white opacity-100" : "bg-[var(--surface-hover)] text-[var(--text)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      } ${className}`}
    >
      <IconHanger size={18} stroke={1.8} className="max-sm:h-[15px] max-sm:w-[15px]" />
    </button>
  );
}

export function RatingChip({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={`pointer-events-none flex items-center gap-1 rounded-full bg-[var(--primaryColor)]/[0.08] px-2 py-0.5 text-[10px] font-medium text-[var(--text)] ring-1 ring-[var(--primaryColor)]/15 backdrop-blur-xl sm:px-2.5 sm:py-1 sm:text-[11px] ${className}`}
    >
      <IconStarFilled size={11} className="text-[var(--star)]" />
      {value.toFixed(1)}
    </span>
  );
}

export function ProductCard({ product: p, index = 0, decimals = false }: { product: Product; index?: number; decimals?: boolean }) {
  const { d, lang, href, price } = useI18n();
  const reduce = useReducedMotion();
  const add = useCart((s) => s.add);
  const showToast = useUi((s) => s.showToast);
  const name = t(p.name, lang);
  const sale = onSale(p);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
      className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[var(--product-card-bg)] sm:aspect-square"
      data-testid="product-card"
    >
      <Link href={href(`/products/${p.slug}`)} aria-label={name} className="absolute inset-0">
        <span className="absolute inset-2 bottom-[4.25rem] block overflow-hidden rounded-[1.1rem] sm:inset-3 sm:bottom-24">
          <Image
            src={p.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </span>
      </Link>
      <div className="absolute start-3 top-3 flex flex-col gap-2 sm:start-5 sm:top-5">
        <WishButton product={p} />
        <TryOnButton product={p} />
      </div>
      <RatingChip value={p.rating} className="absolute end-3 top-3 sm:end-5 sm:top-5" />
      <div className="pointer-events-none absolute bottom-3 end-14 start-3 min-w-0 sm:bottom-4 sm:end-16 sm:start-4">
        <p className="truncate text-xs leading-tight text-[var(--text-muted)]">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className={`text-base font-semibold ${sale ? "text-[var(--accent-text)]" : "text-[var(--text)]"}`}>{price(p.price, decimals)}</span>
          {sale && (
            <>
              <span className="text-xs text-[var(--text-muted)] line-through">{price(p.compareAtPrice!, decimals)}</span>
              <span className="rounded-full bg-[var(--primaryColor)]/[0.08] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent-text)] ring-1 ring-[var(--primaryColor)]/15 backdrop-blur-xl max-sm:hidden">
                {d.product.sale}
              </span>
            </>
          )}
        </div>
      </div>
      {/* Orange quarter-circle that grows from the corner behind the cart button. */}
      <div className="pointer-events-none absolute bottom-0 end-0 h-24 w-24 origin-bottom-right scale-0 rounded-ss-full bg-[var(--primaryColor)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 rtl:origin-bottom-left" />
      <button
        type="button"
        aria-label={d.product.addToCart}
        onClick={() => {
          add(p.id, defaultVariant(p));
          showToast(d.product.added);
        }}
        className="absolute bottom-2 end-2 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text)] transition-[color,transform] duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)] group-hover:text-white sm:bottom-4 sm:end-4 sm:h-10 sm:w-10"
      >
        <IconShoppingBagPlus size={22} stroke={1.6} />
      </button>
    </motion.div>
  );
}
