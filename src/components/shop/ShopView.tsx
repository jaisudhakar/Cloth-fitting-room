"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES, GENDERS, PRODUCTS, t, type Product } from "@/lib/products";
import { searchProducts } from "@/lib/search";
import { ProductGrid } from "../ProductCard";
import { useI18n } from "../providers/I18nProvider";

const SORTS = ["featured", "newest", "priceAsc", "priceDesc", "rating"] as const;
type Sort = (typeof SORTS)[number];
const PRICE_CAPS = [50, 100, 200];

const ALL_SIZES = Array.from(new Set(PRODUCTS.flatMap((p) => p.sizes)));
const ALL_COLORS = Array.from(new Map(PRODUCTS.flatMap((p) => p.colors).map((c) => [c.hex, c])).values());

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

function applyFilters(sp: URLSearchParams): Product[] {
  const q = sp.get("q") ?? "";
  const cats = list(sp.get("category"));
  const genders = list(sp.get("gender"));
  const sizes = list(sp.get("size"));
  const colors = list(sp.get("color"));
  const max = Number(sp.get("max")) || Infinity;
  const sale = sp.get("sale") === "1";
  const sort = (sp.get("sort") as Sort) || "featured";

  let items = q ? searchProducts(q) : PRODUCTS;
  items = items.filter(
    (p) =>
      (!cats.length || cats.includes(p.category)) &&
      // Unisex pieces show under both women and men.
      (!genders.length || genders.includes(p.gender) || p.gender === "unisex") &&
      (!sizes.length || p.sizes.some((s) => sizes.includes(s))) &&
      (!colors.length || p.colors.some((c) => colors.includes(c.hex.slice(1)))) &&
      p.price <= max &&
      (!sale || !!p.compareAt),
  );
  const sorted = [...items];
  if (sort === "newest") sorted.sort((a, b) => b.added - a.added);
  if (sort === "priceAsc") sorted.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") sorted.sort((a, b) => b.price - a.price);
  if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}

export function ShopView() {
  const { d, f, lang } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const items = useMemo(() => applyFilters(new URLSearchParams(sp.toString())), [sp]);

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const toggle = (key: string, value: string) => {
    const cur = list(sp.get(key));
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    set(key, next.join(",") || null);
  };
  const has = (key: string, value: string) => list(sp.get(key)).includes(value);
  const q = sp.get("q");
  const activeCount = ["category", "gender", "size", "color", "max", "sale"].reduce((n, k) => n + list(sp.get(k)).length, 0);
  const title =
    q ? f(d.shop.searchFor, { q }) :
    sp.get("sale") === "1" ? d.nav.sale :
    list(sp.get("category")).length === 1 ? d.category[sp.get("category") as keyof typeof d.category] :
    list(sp.get("gender")).length === 1 ? d.gender[sp.get("gender") as keyof typeof d.gender] :
    d.shop.title;

  const filters = (
    <div className="space-y-8">
      <Group title={d.shop.category}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={has("category", c)} onClick={() => toggle("category", c)}>
              {d.category[c]}
            </button>
          ))}
        </div>
      </Group>
      <Group title={d.shop.gender}>
        <div className="flex flex-wrap gap-2">
          {GENDERS.filter((g) => g !== "unisex").map((g) => (
            <button key={g} className="chip" aria-pressed={has("gender", g)} onClick={() => toggle("gender", g)}>
              {d.gender[g]}
            </button>
          ))}
        </div>
      </Group>
      <Group title={d.shop.size}>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button key={s} className="chip min-w-11 px-2" aria-pressed={has("size", s)} onClick={() => toggle("size", s)}>
              {s}
            </button>
          ))}
        </div>
      </Group>
      <Group title={d.shop.color}>
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLORS.map((c) => (
            <button
              key={c.hex}
              aria-pressed={has("color", c.hex.slice(1))}
              onClick={() => toggle("color", c.hex.slice(1))}
              title={t(c.name, lang)}
              aria-label={t(c.name, lang)}
              className="size-7 rounded-full border border-black/10 ring-offset-2 ring-offset-bg aria-pressed:ring-2 aria-pressed:ring-fg"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </Group>
      <Group title={d.shop.price}>
        <div className="flex flex-wrap gap-2">
          {PRICE_CAPS.map((n) => (
            <button key={n} className="chip" aria-pressed={sp.get("max") === String(n)} onClick={() => set("max", sp.get("max") === String(n) ? null : String(n))}>
              {f(d.shop.under, { n })}
            </button>
          ))}
        </div>
      </Group>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={sp.get("sale") === "1"} onChange={(e) => set("sale", e.target.checked ? "1" : null)} />
        {d.shop.onSale}
      </label>
    </div>
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-fg-muted" data-testid="result-count">
            {f(d.shop.results, { n: items.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline lg:hidden" onClick={() => setPanelOpen(true)}>
            <SlidersHorizontal className="size-4" />
            {d.shop.filters}
            {activeCount > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-accent-fg">{activeCount}</span>}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-fg-muted max-sm:sr-only">{d.shop.sort}</span>
            <select
              className="input h-10 w-auto rounded-full pe-8"
              value={sp.get("sort") ?? "featured"}
              onChange={(e) => set("sort", e.target.value === "featured" ? null : e.target.value)}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {d.shop.sortOptions[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold">{d.shop.filters}</p>
              {(activeCount > 0 || q) && (
                <button className="text-sm text-fg-muted underline" onClick={() => router.replace(pathname, { scroll: false })}>
                  {d.shop.clear}
                </button>
              )}
            </div>
            {filters}
          </div>
        </aside>
        <div>
          {items.length ? (
            <ProductGrid products={items} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-16 text-center">
              <p className="text-fg-muted">{d.shop.empty}</p>
              <button className="btn-outline mt-4" onClick={() => router.replace(pathname)}>
                {d.shop.clear}
              </button>
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={d.shop.filters}>
          <div className="fade-in absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <div className="drawer-end absolute inset-y-0 end-0 flex w-full max-w-sm flex-col bg-bg">
            <div className="flex items-center justify-between border-b border-line p-4">
              <p className="font-semibold">{d.shop.filters}</p>
              <button className="icon-btn" onClick={() => setPanelOpen(false)} aria-label={d.nav.close}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
              <button className="btn-outline" onClick={() => router.replace(pathname, { scroll: false })}>
                {d.shop.clear}
              </button>
              <button className="btn-primary" onClick={() => setPanelOpen(false)}>
                {d.shop.showResults} ({items.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
