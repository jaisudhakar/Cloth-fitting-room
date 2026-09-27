import { ArrowRight, Camera, RotateCcw, ShieldCheck, Shirt, Ruler, Truck, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GarmentImage } from "@/components/GarmentImage";
import { Newsletter } from "@/components/Newsletter";
import { OutfitPreview } from "@/components/OutfitPreview";
import { ProductGrid } from "@/components/ProductCard";
import { AVATARS } from "@/lib/avatars";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { CATEGORIES, PRODUCTS } from "@/lib/products";

const CATEGORY_ART = {
  tops: { kind: "hoodie", color: "#8fa58a" },
  bottoms: { kind: "jeans", color: "#3d5f8f" },
  dresses: { kind: "dress", color: "#c24d74" },
  outerwear: { kind: "coat", color: "#b08254" },
} as const;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const h = (p: string) => `/${lang}${p}`;
  const newest = [...PRODUCTS].sort((a, b) => b.added - a.added).slice(0, 4);
  const best = PRODUCTS.filter((p) => p.tags.includes("bestseller")).slice(0, 4);
  const perkIcons = [Truck, RotateCcw, Shirt, ShieldCheck];
  const stepIcons = [Camera, Shirt, Ruler];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-muted">
        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow">{d.home.heroEyebrow}</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">{d.home.heroTitle}</h1>
            <p className="mt-6 text-lg text-fg-muted">{d.home.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={h("/shop")} className="btn-primary h-12 px-7">
                {d.home.shopNow}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <Link href={h("/fitting-room")} className="btn-outline h-12 px-7">
                <Sparkles className="size-4 text-accent" />
                {d.home.tryNow}
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center gap-4">
            <OutfitPreview
              avatar={AVATARS[0]}
              pieces={[{ kind: "pants", color: "#d6c7a1" }, { kind: "sweater", color: "#ece8e1" }, { kind: "coat", color: "#b08254" }]}
              className="h-[440px] w-auto rounded-3xl shadow-xl sm:h-[520px]"
              label={d.fitting.title}
            />
            <OutfitPreview
              avatar={AVATARS[1]}
              pieces={[{ kind: "jeans", color: "#26334d" }, { kind: "hoodie", color: "#5f6b3a" }]}
              className="mt-16 hidden h-[420px] w-auto rounded-3xl shadow-xl sm:block"
              label={d.fitting.title}
            />
            <div className="absolute bottom-6 start-2 flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm shadow-lg sm:start-10">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              {d.fitting.title}
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-line">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {d.home.perks.map((perk, i) => {
            const Icon = perkIcons[i];
            return (
              <div key={perk.title} className="flex items-center gap-3">
                <Icon className="size-6 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold">{perk.title}</p>
                  <p className="text-xs text-fg-muted">{perk.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-16">
        <h2 className="font-display text-3xl">{d.home.categories}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c} href={h(`/shop?category=${c}`)} className="group relative overflow-hidden rounded-2xl">
              <GarmentImage
                kind={CATEGORY_ART[c].kind}
                color={CATEGORY_ART[c].color}
                alt=""
                className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-surface/95 px-4 py-2.5 text-sm font-medium">
                {d.category[c]}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x py-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl">{d.home.newArrivals}</h2>
          <Link href={h("/shop?sort=newest")} className="text-sm font-medium underline-offset-4 hover:underline">
            {d.home.viewAll}
          </Link>
        </div>
        <ProductGrid products={newest} />
      </section>

      {/* Fitting room teaser */}
      <section className="container-x py-16">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-primary p-8 text-primary-fg sm:p-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{d.nav.fittingRoom}</p>
            <h2 className="mt-3 font-display text-4xl">{d.home.fitTitle}</h2>
            <p className="mt-3 opacity-80">{d.home.fitText}</p>
            <ol className="mt-8 space-y-5">
              {d.home.fitSteps.map((s, i) => {
                const Icon = stepIcons[i];
                return (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fg/10">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm opacity-75">{s.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Link href={h("/fitting-room")} className="btn mt-8 h-12 bg-accent px-7 text-accent-fg hover:opacity-90">
              {d.home.tryNow}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="flex justify-center gap-3">
            {[
              { a: AVATARS[2], p: [{ kind: "dress", color: "#0f6e5c" }] },
              { a: AVATARS[3], p: [{ kind: "shorts", color: "#d6c7a1" }, { kind: "shirt", color: "#8fb3d9" }] },
            ].map(({ a, p }, i) => (
              <OutfitPreview
                key={a.id}
                avatar={a}
                pieces={p as { kind: "dress"; color: string }[]}
                className={`h-80 w-auto rounded-2xl sm:h-96 ${i ? "mt-10" : ""}`}
                label={d.fitting.title}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="container-x py-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl">{d.home.bestSellers}</h2>
          <Link href={h("/shop?sort=rating")} className="text-sm font-medium underline-offset-4 hover:underline">
            {d.home.viewAll}
          </Link>
        </div>
        <ProductGrid products={best} />
      </section>

      {/* Promo */}
      <section className="container-x py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-accent/10 p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-display text-3xl">{d.home.promoTitle}</h2>
            <p className="mt-2 text-fg-muted">{d.home.promoText}</p>
          </div>
          <Link href={h("/shop?sale=1")} className="btn-accent h-12 px-7">
            {d.home.shopSale}
          </Link>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
