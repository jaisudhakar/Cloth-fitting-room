"use client";

import { IconArrowUpRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { HOME, productsBySlugs, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { Reveal } from "../ui/Reveal";
import { ViewAll } from "../ui/SectionHeader";

const NUMERALS = ["I", "II", "III"];

/** "Three quiet obsessions": panels that widen on hover and reveal their story. */
export function StylePillars() {
  const { d, lang, href } = useI18n();
  const products = productsBySlugs(HOME.pillars);
  return (
    <section className="relative overflow-hidden bg-[var(--background)]">
      <Reveal className="mx-auto flex max-w-[1400px] flex-col items-start gap-4 px-4 pb-8 pt-32 md:flex-row md:items-end md:justify-between md:gap-6 md:px-8 md:pb-16 md:pt-28">
        <div className="min-w-0">
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-[var(--accent-text)] md:tracking-[0.4em] rtl:tracking-normal">{d.home.pillarsEyebrow}</p>
          <h2 className="text-[1.75rem] font-light leading-[1.05] tracking-[-0.01em] text-[var(--text)] sm:text-3xl md:text-5xl">
            {d.home.pillarsTitle1}
            <span className="block font-semibold">{d.home.pillarsTitle2}</span>
          </h2>
        </div>
        <ViewAll href={href("/shop")} label={d.home.viewAll} />
      </Reveal>
      <div className="px-4 pb-8 md:px-8 md:pb-28">
        <div className="mx-auto flex h-auto min-h-[338px] max-w-[1400px] flex-col gap-2 md:h-[51vh] md:max-h-[550px] md:min-h-[390px] md:flex-row md:gap-3">
          {products.map((p, i) => {
            const pillar = d.home.pillars[i];
            return (
              <Reveal key={p.id} y={40} delay={i * 0.1} className="flex min-h-[280px] flex-1 md:min-h-0 md:basis-0 md:transition-[flex-grow] md:duration-700 md:ease-[cubic-bezier(0.22,1,0.36,1)] md:has-[a:hover]:flex-[2.2] md:has-[a:focus-visible]:flex-[2.2]">
                <Link href={href(`/products/${p.slug}`)} className="group/panel relative flex-1 overflow-hidden rounded-[1.5rem] bg-[var(--product-card-bg)]">
                  <Image
                    src={p.image}
                    alt={t(p.name, lang)}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-3 transition-transform duration-[1.6s] ease-out group-hover/panel:scale-[1.04] max-md:pb-28 md:p-10"
                  />
                  <span className="pointer-events-none absolute end-4 top-3 select-none font-serif text-[34px] italic leading-none text-[var(--primaryColor)]/35 md:end-8 md:top-6 md:text-[64px]">
                    {NUMERALS[i]}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-[var(--product-card-bg)] via-[var(--product-card-bg)]/85 to-transparent p-4 md:gap-3 md:p-8">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] md:tracking-[0.4em] rtl:tracking-normal">{pillar.edit}</span>
                    <h3 className="text-2xl font-semibold leading-[0.95] tracking-[-0.015em] text-[var(--text)] md:text-5xl">{pillar.title}</h3>
                    <div className="max-h-none overflow-hidden transition-[max-height] duration-700 ease-out md:max-h-0 md:group-hover/panel:max-h-[10rem] md:group-focus-visible/panel:max-h-[10rem]">
                      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-[var(--text-muted)] max-md:line-clamp-2 md:text-[15px]">{pillar.text}</p>
                      <div className="mt-5 hidden items-center justify-between gap-3 border-t border-[var(--border)] pt-3 md:flex">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{d.home.shownHere}</p>
                          <p className="truncate text-xs text-[var(--text)] md:text-sm">{t(p.name, lang)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text)]">
                          {d.home.shop}
                          <IconArrowUpRight size={14} stroke={1.8} className="transition-transform group-hover/panel:-translate-y-0.5 group-hover/panel:translate-x-0.5 rtl:-scale-x-100" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-[var(--border)]/40 transition-colors duration-500 group-hover/panel:ring-[var(--text)]/30" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
