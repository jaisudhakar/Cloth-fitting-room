"use client";

import { IconArrowRight, IconChevronDown, IconSearch } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { Breadcrumbs, PromoCarousel } from "../shop/PromoCarousel";

export function Categories() {
  const { d, f, lang, href } = useI18n();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"default" | "az" | "za">("default");
  let list = CATEGORIES.filter((c) => t(c.name, lang).toLowerCase().includes(q.toLowerCase()));
  if (sort !== "default") list = [...list].sort((a, b) => t(a.name, lang).localeCompare(t(b.name, lang)) * (sort === "az" ? 1 : -1));
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: d.categories.title }]} />
      <PromoCarousel
        slides={[
          { eyebrow: d.categories.bannerEyebrow, title: d.categories.bannerTitle, text: d.categories.bannerText, cta: d.categories.bannerCta, href: href("/shop"), image: "/assets/images/nav/shop-promo.jpg" },
          { ...d.shop.banners[1], href: href(d.shop.banners[1].href) },
        ]}
      />
      <div className="mt-8 rounded-[1.5rem] bg-[var(--surface-elevated)] p-6">
        <h1 className="flex items-baseline gap-3 text-2xl font-semibold md:text-[2rem]">
          {d.categories.title} <span className="text-sm font-normal text-[var(--text-muted)]">{f(d.categories.count, { n: list.length })}</span>
        </h1>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <IconSearch size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.categories.search} className="h-10 w-full rounded-full bg-[var(--input-bg)] pe-4 ps-10 text-sm outline-none focus:ring-2 focus:ring-[var(--primaryColor)]" />
          </div>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 w-40 appearance-none rounded-full bg-[var(--input-bg)] pe-9 ps-4 text-sm outline-none">
              {(["default", "az", "za"] as const).map((k) => (
                <option key={k} value={k}>
                  {d.categories.sort[k]}
                </option>
              ))}
            </select>
            <IconChevronDown size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((c, i) => (
          <motion.div key={c.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i % 4) * 0.08 }}>
            <Link href={href(`/shop?category=${c.slug}`)} className="group relative block aspect-square overflow-hidden rounded-[1.5rem] bg-[var(--product-card-bg)]">
              <Image src={c.image} alt={t(c.name, lang)} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-white">{t(c.name, lang)}</h2>
                  <p className="truncate text-xs text-white/75">{t(c.description, lang)}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primaryColor)] text-white transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <IconArrowRight size={16} className="rtl:-scale-x-100" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
