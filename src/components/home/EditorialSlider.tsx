"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HOME, productsBySlugs, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { SectionHeader } from "../ui/SectionHeader";

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
// Collapsed cards step up and down in height, like a rack of hanging pieces.
const HEIGHTS = [92, 83, 65, 97, 74];
const GAP = 0.45; // % of width between cards

/** "Shop the Collection": one expanded card, the rest collapsed to numbered strips. Auto-advances. */
export function EditorialSlider() {
  const { d, lang, href } = useI18n();
  const products = productsBySlugs(HOME.slider);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = products.length;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 4200);
    return () => clearInterval(id);
  }, [paused, n]);

  const activeW = 40;
  const restW = (100 - activeW - GAP * (n - 1)) / (n - 1);
  const layout = products.map((_, i) => {
    const isActive = i === active;
    // Cards before the active one are all collapsed, so offsets are closed-form.
    const left = i * (restW + GAP) + (i > active ? activeW - restW : 0);
    const slot = i < active ? i : i - 1;
    const h = isActive ? 100 : HEIGHTS[slot % HEIGHTS.length];
    return { left, width: isActive ? activeW : restW, height: h, top: (100 - h) / 2 };
  });

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] px-4 pb-7 pt-10 md:px-8 md:pb-10 md:pt-20">
        <SectionHeader eyebrow={d.home.sliderEyebrow} light={d.home.sliderTitle1} bold={d.home.sliderTitle2} viewAll={{ href: href("/shop"), label: d.home.viewAll }} />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 pb-14 md:px-8 md:pb-20">
        <div
          className="dark relative h-[360px] w-full overflow-hidden sm:h-[440px] md:h-[520px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {products.map((p, i) => {
            const box = layout[i];
            const isActive = i === active;
            const num = String(i + 1).padStart(2, "0");
            return (
              <Link
                key={p.id}
                href={href(`/products/${p.slug}`)}
                onClick={(e) => {
                  if (!isActive) {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
                aria-label={t(p.name, lang)}
                aria-current={isActive}
                className="absolute overflow-hidden bg-[var(--product-card-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)]"
                style={{
                  insetInlineStart: `${box.left}%`,
                  width: `${box.width}%`,
                  top: `${box.top}%`,
                  height: `${box.height}%`,
                  borderRadius: isActive ? "0.75rem" : "0.5rem",
                  transition: `inset-inline-start .55s ${EASE}, width .55s ${EASE}, top .55s ${EASE}, height .55s ${EASE}, border-radius .55s ${EASE}`,
                }}
              >
                <Image
                  src={p.image}
                  alt={t(p.name, lang)}
                  fill
                  sizes="(max-width: 768px) 60vw, 40vw"
                  className="object-cover"
                  style={{ objectPosition: "center 35%", opacity: isActive ? 1 : 0.82, transform: isActive ? "scale(1)" : "scale(1.08)", transition: `opacity .7s cubic-bezier(.25,1,.5,1), transform 1.2s cubic-bezier(.25,1,.5,1)` }}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(to top, var(--product-card-bg) 0%, transparent 55%)", opacity: isActive ? 1 : 0, transition: "opacity .45s cubic-bezier(.25,1,.5,1)" }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity: isActive ? 0 : 1, transition: "opacity .3s" }}>
                  <span className="rotate-180 text-[11px] font-light tracking-[0.3em] text-[var(--text-muted)] [writing-mode:vertical-rl]">{num}</span>
                </div>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden px-5 pb-5 md:px-10 md:pb-8"
                  style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateY(0)" : "translateY(12px)", transition: `opacity .3s cubic-bezier(.25,1,.5,1) ${isActive ? ".3s" : "0s"}, transform .5s cubic-bezier(.25,1,.5,1) ${isActive ? ".3s" : "0s"}` }}
                >
                  <p className="mb-2 whitespace-nowrap text-[10px] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    {num} / {String(n).padStart(2, "0")}
                  </p>
                  <h3 className="truncate text-lg font-light uppercase leading-[1.1] tracking-[0.08em] text-[var(--text)] md:text-[1.75rem] rtl:tracking-normal">{t(p.name, lang)}</h3>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex justify-center gap-1.5" role="tablist">
          {products.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === active}
              aria-label={t(p.name, lang)}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-[var(--primaryColor)]" : "w-1.5 bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/60"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
