"use client";

import { IconAdjustmentsHorizontal, IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES, PRODUCTS, categoryBySlug, onSale, searchProducts, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { ProductCard } from "../product/ProductCard";
import { Breadcrumbs, PromoCarousel } from "./PromoCarousel";

const PER_PAGE = 12;
const SORTS = ["newest", "best_selling", "popular", "price_asc", "price_desc"] as const;
type Sort = (typeof SORTS)[number];
const PRICE_MAX = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 50) * 50;

export function ShopView() {
  const { d, f, lang, href } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = sp.get("q") ?? "";
  const category = sp.get("category");
  const sort = (SORTS as readonly string[]).includes(sp.get("sort") ?? "") ? (sp.get("sort") as Sort) : "newest";
  const sale = sp.get("sale") === "true";
  const featured = sp.get("featured") === "true";
  const best = sp.get("best") === "true";
  const min = Number(sp.get("min") ?? 0) || 0;
  const max = Number(sp.get("max") ?? PRICE_MAX) || PRICE_MAX;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const items = useMemo(() => {
    let list = q ? searchProducts(q) : PRODUCTS;
    const cat = category ? categoryBySlug(category) : undefined;
    list = list.filter(
      (p) =>
        (!cat || p.categoryId === cat.id) &&
        (!sale || onSale(p)) &&
        (!featured || p.featured) &&
        (!best || p.bestSeller) &&
        p.price >= min &&
        p.price <= max,
    );
    const sorted = [...list];
    if (sort === "best_selling") sorted.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.reviewCount - a.reviewCount);
    if (sort === "popular") sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [q, category, sale, featured, best, min, max, sort]);

  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = items.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const activeCat = category ? categoryBySlug(category) : undefined;
  const title = activeCat ? t(activeCat.name, lang) : sale ? d.shop.onSale : sp.get("sort") === "newest" ? d.nav.newArrivals : d.shop.allProducts;

  const filters = (
    <div className="space-y-8">
      <div className="relative">
        <IconSearch size={16} stroke={1.8} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          defaultValue={q}
          key={q}
          onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value.trim() || null })}
          onBlur={(e) => e.target.value.trim() !== q && set({ q: e.target.value.trim() || null })}
          placeholder={d.shop.searchPlaceholder}
          className="h-10 w-full rounded-full border border-[var(--input-border)]/60 bg-[var(--input-bg)] pe-4 ps-10 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primaryColor)]"
          aria-label={d.shop.searchPlaceholder}
        />
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">{d.shop.category}</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => set({ category: null })}
              className={`flex w-full items-center gap-3 rounded-full py-1.5 pe-3 ps-1.5 text-start text-sm transition-colors ${
                !category ? "bg-[var(--primaryColor)]/10 font-medium text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primaryColor)]/10 text-xs text-[var(--primaryColor)]">★</span>
              {d.shop.allCategories}
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => set({ category: c.slug })}
                className={`flex w-full items-center gap-3 rounded-full py-1.5 pe-3 ps-1.5 text-start text-sm transition-colors ${
                  category === c.slug ? "bg-[var(--primaryColor)]/10 font-medium text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                }`}
              >
                <Image src={c.image} alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-[var(--primaryColor)]/10 object-cover" />
                {t(c.name, lang)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <PriceRange min={min} max={max} limit={PRICE_MAX} onChange={(a, b) => set({ min: a > 0 ? String(a) : null, max: b < PRICE_MAX ? String(b) : null })} />
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">{d.shop.highlights}</h3>
        <div className="space-y-2.5">
          {(
            [
              ["sale", d.shop.onSale, sale],
              ["featured", d.shop.featured, featured],
              ["best", d.shop.bestSellers, best],
            ] as const
          ).map(([key, label, on]) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
              {label}
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => set({ [key]: on ? null : "true" })}
                className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-[var(--primaryColor)]" : "bg-[var(--surface-hover)]"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "start-[1.125rem]" : "start-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: d.nav.shop, href: href("/shop") }, { label: title }]} />
      <PromoCarousel slides={d.shop.banners.map((b) => ({ ...b, href: href(b.href) }))} />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="flex items-baseline gap-3 text-2xl font-semibold text-[var(--text)] md:text-[2rem]">
          {q ? `“${q}”` : title}
          <span className="text-sm font-normal text-[var(--text-muted)]" data-testid="result-count">
            {f(d.shop.products, { n: items.length })}
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="flex h-10 items-center gap-2 rounded-full bg-[var(--surface-elevated)] px-4 text-sm lg:hidden">
            <IconAdjustmentsHorizontal size={16} /> {d.shop.showFilters}
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => set({ sort: e.target.value })}
              className="h-10 w-48 appearance-none rounded-full bg-[var(--surface-elevated)] pe-9 ps-4 text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)]"
              aria-label="Sort"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {d.shop.sort[s]}
                </option>
              ))}
            </select>
            <IconChevronDown size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[288px_1fr]">
        <aside className="hidden h-fit rounded-[1.5rem] bg-[var(--surface-elevated)] p-6 lg:sticky lg:top-24 lg:block">
          <h2 className="mb-6 text-sm font-semibold text-[var(--text)]">{d.shop.filters}</h2>
          {filters}
        </aside>
        <div>
          {visible.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 xl:grid-cols-3">
              {visible.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-[1.5rem] bg-[var(--surface-elevated)] p-16 text-center">
              <p className="text-[var(--text-muted)]">{d.shop.empty}</p>
              <button className="text-sm font-medium text-[var(--accent-text)] underline" onClick={() => router.replace(pathname)}>
                {d.shop.clear}
              </button>
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <button
                disabled={current === 1}
                onClick={() => set({ page: String(current - 1) })}
                className="h-10 rounded-full px-4 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
              >
                {d.shop.previous}
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => set({ page: String(n) })}
                  aria-current={n === current ? "page" : undefined}
                  className={`h-10 w-10 rounded-full text-sm transition-colors ${n === current ? "bg-[var(--primaryColor)] text-white" : "text-[var(--text)] hover:bg-[var(--surface-hover)]"}`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={current === pages}
                onClick={() => set({ page: String(current + 1) })}
                className="h-10 rounded-full px-4 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
              >
                {d.shop.next}
              </button>
            </nav>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-[95] lg:hidden" role="dialog" aria-modal="true" aria-label={d.shop.filters}>
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.aside
              initial={{ x: lang === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "ar" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 start-0 w-[88%] max-w-sm overflow-y-auto bg-[var(--surface-elevated)] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{d.shop.filters}</h2>
                <button onClick={() => setFiltersOpen(false)} aria-label={d.common.close} className="rounded-full p-1.5 hover:bg-[var(--surface-hover)]">
                  <IconX size={18} />
                </button>
              </div>
              {filters}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriceRange({ min, max, limit, onChange }: { min: number; max: number; limit: number; onChange: (min: number, max: number) => void }) {
  const { d } = useI18n();
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const [synced, setSynced] = useState(`${min}-${max}`);
  if (synced !== `${min}-${max}`) {
    setSynced(`${min}-${max}`);
    setLo(min);
    setHi(max);
  }
  const commit = () => onChange(Math.min(lo, hi), Math.max(lo, hi));
  const pct = (v: number) => (v / limit) * 100;
  const thumb =
    "pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--primaryColor)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primaryColor)] [&::-webkit-slider-thumb]:shadow";
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">{d.shop.priceRange}</h3>
      <div className="relative h-5" dir="ltr">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--surface-hover)]" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--primaryColor)]" style={{ left: `${pct(Math.min(lo, hi))}%`, right: `${100 - pct(Math.max(lo, hi))}%` }} />
        <input type="range" min={0} max={limit} step={5} value={lo} onChange={(e) => setLo(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} className={thumb} aria-label={d.shop.min} />
        <input type="range" min={0} max={limit} step={5} value={hi} onChange={(e) => setHi(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} className={thumb} aria-label={d.shop.max} />
      </div>
      <div className="mt-4 flex items-center gap-2" dir="ltr">
        {[
          [lo, setLo, d.shop.min],
          [hi, setHi, d.shop.max],
        ].map(([v, setV, label], i) => (
          <label key={i} className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
            <input
              type="number"
              min={0}
              max={limit}
              value={v as number}
              placeholder={label as string}
              onChange={(e) => (setV as (n: number) => void)(Number(e.target.value))}
              onBlur={commit}
              className="h-10 w-full rounded-full border border-[var(--input-border)]/60 bg-[var(--input-bg)] pe-3 ps-6 text-sm outline-none focus:border-[var(--primaryColor)]"
              aria-label={label as string}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
