"use client";

import { IconArrowRight, IconStarFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, HOME, productBySlug, productsBySlugs, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { ProductCard } from "../product/ProductCard";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";
import { SectionHeader } from "../ui/SectionHeader";

export function EditorialSplit() {
  const { d, lang, href } = useI18n();
  const products = productsBySlugs(HOME.editorialSplit);
  const hero = products[0];
  return (
    <Reveal as="section" className="mx-auto max-w-[1400px] px-4 pb-10 pt-2 sm:pb-20 sm:pt-6 md:px-8 md:pb-28 md:pt-8">
      <div className="grid grid-cols-1 items-stretch gap-6 md:gap-10 lg:grid-cols-2">
        <Link href={href("/shop?sort=newest")} className="group relative aspect-[5/4] overflow-hidden rounded-[1.5rem] bg-[var(--surface)] sm:aspect-[4/5] lg:aspect-auto lg:min-h-[560px]">
          <Image src={hero.image} alt={t(hero.name, lang)} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/95 via-white/55 to-transparent dark:from-black/70 dark:via-black/30" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/70 via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-black/50 dark:via-black/20" />
          <div className="absolute bottom-5 end-5 start-5 sm:bottom-6 sm:end-auto sm:start-6 md:bottom-10 md:start-10">
            <p className="mb-2 text-[0.7rem] uppercase tracking-[0.3em] text-[var(--primaryColor)] sm:text-xs rtl:tracking-normal">{d.home.splitEyebrow}</p>
            <h3 className="text-xl font-light leading-tight text-[var(--text)] sm:text-2xl md:text-3xl dark:text-white">
              {d.home.splitImage1}
              <br />
              <span className="font-semibold">{d.home.splitImage2}</span>
            </h3>
          </div>
        </Link>
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{d.home.splitSub}</p>
            <h2 className="text-[1.75rem] font-light leading-tight text-[var(--text)] sm:text-3xl md:text-4xl">
              {d.home.splitTitle1}
              <br />
              <span className="font-semibold">{d.home.splitTitle2}</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">{d.home.splitText}</p>
            <Link href={href("/shop?sort=newest")} className="group mt-6 inline-flex items-center text-sm font-medium text-[var(--text)] transition-opacity hover:opacity-70">
              {d.home.splitCta}
              <IconArrowRight size={16} stroke={1.8} className="ms-2 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function CategoriesGrid() {
  const { d, lang, href } = useI18n();
  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-8 md:px-8 md:pb-14 md:pt-10">
        <SectionHeader eyebrow={d.home.catEyebrow} light={d.home.catTitle1} bold={d.home.catTitle2} viewAll={{ href: href("/categories"), label: d.home.viewAll }} />
        <div className="scrollbar-hidden -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 md:gap-4 lg:grid-cols-7">
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="max-sm:w-[30%] max-sm:shrink-0 max-sm:snap-start"
            >
              <Link
                href={href(`/shop?category=${c.slug}`)}
                className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-[1.25rem] bg-[var(--product-card-bg)] p-2.5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.9rem]">
                  <Image src={c.image} alt={t(c.name, lang)} fill sizes="(max-width: 640px) 30vw, 14vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <h3 className="truncate px-1 pt-2.5 text-center text-[0.75rem] font-semibold tracking-wide text-[var(--text)] transition-colors group-hover:text-[var(--primaryColor)]">
                  {t(c.name, lang)}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewDrops() {
  const { d, href } = useI18n();
  const products = productsBySlugs(HOME.newDrops);
  return (
    <section>
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-8 md:px-8 md:pb-12 md:pt-14">
        <SectionHeader center eyebrow={d.home.dropsEyebrow} light={d.home.dropsTitle1} bold={d.home.dropsTitle2} text={d.home.dropsText} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="mt-8 flex justify-center md:mt-12">
          <ButtonLink href={href("/shop?sort=newest")} variant="soft">
            {d.home.dropsCta}
            <IconArrowRight size={16} stroke={1.8} className="rtl:-scale-x-100" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function OfferBanner() {
  const { d, href } = useI18n();
  return (
    <Reveal as="section" className="mx-auto max-w-[1400px] px-4 py-3 md:px-8 md:py-4">
      <div className="group relative flex flex-col overflow-hidden rounded-2xl sm:min-h-[300px] sm:flex-row sm:items-center lg:min-h-[320px]" style={{ backgroundColor: "rgb(28,28,30)" }}>
        <div className="relative h-56 w-full shrink-0 sm:absolute sm:inset-0 sm:h-auto sm:w-auto">
          <Image src="/assets/images/home/offer-banner.png" alt="" fill sizes="100vw" className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.03] sm:object-right rtl:-scale-x-100" />
          <div className="absolute inset-x-0 bottom-0 h-16 sm:hidden" style={{ background: "linear-gradient(to top, rgb(28,28,30) 0%, transparent 100%)" }} />
        </div>
        <div className="absolute inset-0 hidden sm:block sm:rtl:hidden" style={{ background: "linear-gradient(to right, rgb(28,28,30) 0%, rgb(28,28,30) 32%, transparent 70%)" }} />
        <div className="absolute inset-0 hidden sm:rtl:block" style={{ background: "linear-gradient(to left, rgb(28,28,30) 0%, rgb(28,28,30) 32%, transparent 70%)" }} />
        <div className="relative flex max-w-md flex-col px-6 pb-9 pt-5 sm:px-8 sm:py-10 md:px-14">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-white/40 sm:mb-4 sm:text-[11px] sm:tracking-[0.4em] rtl:tracking-normal">{d.home.offerEyebrow}</p>
          <h2 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.01em] text-white sm:text-4xl md:text-5xl">
            {d.home.offerTitle1} <span className="text-[var(--primaryColor)]">{d.home.offerTitle2}</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55 sm:mt-5 md:text-base">{d.home.offerText}</p>
          <div className="mt-6 sm:mt-8">
            <ButtonLink href={href("/shop?sale=true")} size="lg" className="max-sm:h-11 max-sm:px-6">
              {d.home.offerCta}
              <IconArrowRight size={16} stroke={1.8} className="rtl:-scale-x-100" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function BestSellers() {
  const { d, href } = useI18n();
  const products = productsBySlugs(HOME.bestSellers);
  return (
    <section>
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-8 md:px-8 md:pb-16 md:pt-12">
        <SectionHeader eyebrow={d.home.bestEyebrow} light={d.home.bestTitle1} bold={d.home.bestTitle2} viewAll={{ href: href("/shop?sort=popular"), label: d.home.viewAll }} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  const { d, lang, href } = useI18n();
  const products = [productBySlug("olive-bomber-jacket"), productBySlug("navy-zip-up-hoodie"), productBySlug("khaki-chinos")];
  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
        <Reveal className="mb-9 text-center md:mb-14">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{d.home.reviewsEyebrow}</p>
          <h2 className="text-[1.75rem] font-light leading-tight text-[var(--text)] sm:text-3xl md:text-4xl">
            {d.home.reviewsTitle1} <span className="font-semibold">{d.home.reviewsTitle2}</span>
          </h2>
        </Reveal>
        <div className="scrollbar-hidden -mx-4 flex snap-x snap-mandatory scroll-px-4 items-stretch gap-4 overflow-x-auto px-4 pb-1 sm:gap-6 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {d.home.reviews.map((r, i) => {
            const p = products[i];
            return (
              <motion.article
                key={r.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="relative flex h-auto flex-col rounded-[1.5rem] bg-[var(--product-card-bg)] p-6 max-md:w-[86%] max-md:shrink-0 max-md:snap-start sm:p-8 md:h-full md:p-10"
              >
                <div className="mb-3 flex gap-0.5 sm:mb-4">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <IconStarFilled key={s} size={16} className="text-[var(--primaryColor)]" />
                  ))}
                </div>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text)] sm:mb-6">{r.quote}</p>
                <div className="mt-auto flex h-[68px] items-center gap-3 border-t border-[var(--border)] pt-6">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[var(--surface)]">
                    <Image src={r.avatar} alt={r.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{r.name}</p>
                    {p ? (
                      <Link href={href(`/products/${p.slug}`)} className="block truncate text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]" title={t(p.name, lang)}>
                        {r.meta}
                      </Link>
                    ) : (
                      <p className="truncate text-[11px] text-[var(--text-muted)]">{r.meta}</p>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LuxBanner() {
  const { d, href } = useI18n();
  return (
    <Reveal as="section" className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-16">
      <div className="group relative overflow-hidden rounded-[2rem]">
        <Image src="/assets/images/banners/banner-outerwear.jpg" alt="" fill sizes="100vw" className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/85" />
        <div className="relative flex flex-col items-center px-5 py-11 text-center sm:px-6 sm:py-12 md:py-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-white/50 sm:mb-5 sm:tracking-[0.5em] md:text-[11px] rtl:tracking-normal">{d.home.luxEyebrow}</p>
          <h2 className="text-[1.85rem] font-bold leading-[1.08] tracking-[-0.01em] text-white sm:text-3xl md:text-5xl lg:whitespace-nowrap">
            {d.home.luxTitle1} <span className="text-[var(--primaryColor)]">{d.home.luxTitle2}</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:mt-5 md:text-base">{d.home.luxText}</p>
          <ButtonLink href={href("/about")} variant="white" size="lg" className="mt-7 sm:mt-8">
            {d.home.luxCta}
          </ButtonLink>
        </div>
      </div>
    </Reveal>
  );
}
