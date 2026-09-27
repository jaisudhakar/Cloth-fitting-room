"use client";

import { IconArrowUpRight } from "@tabler/icons-react";
import { type MotionValue, motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { HOME, type Product, categoryById, productsBySlugs, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

const SLIDES = 4;

/**
 * One slide in a column. As scroll progress `step` passes the slide's index it
 * wipes in (clip-path) while the photo drifts and the caption rises; `dir`
 * flips the travel so the two columns move in opposite directions.
 */
function Slide({ product, index, step, dir }: { product: Product; index: number; step: MotionValue<number>; dir: 1 | -1 }) {
  const { d, lang, href } = useI18n();
  // 0 = fully hidden (upcoming), 1 = current, 2 = passed.
  const local = useTransform(step, (s) => Math.max(0, Math.min(2, s - index + 1)));
  const clip = useTransform(local, (v) => {
    if (index === 0) return "inset(0% 0 0% 0)";
    const shown = Math.min(1, v) * 100;
    return dir === 1 ? `inset(${100 - shown}% 0 0% 0)` : `inset(0% 0 ${100 - shown}% 0)`;
  });
  const y = useTransform(local, [0, 1, 2], [`${25 * dir}%`, "0%", `${-25 * dir}%`]);
  const captionY = useTransform(local, [0, 1, 2], [`${15 * dir}%`, "0%", `${-15 * dir}%`]);
  const captionOpacity = useTransform(local, [0.6, 1, 1.4], [0, 1, 0]);
  const cat = categoryById(product.categoryId);
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, zIndex: index }}>
      <motion.div className="absolute inset-0" style={{ y, scale: 1.25 }}>
        <Image src={product.image} alt="" fill sizes="(max-width: 768px) 50vw, 360px" className="select-none object-cover" />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0" style={{ y: captionY, opacity: captionOpacity }}>
        <div
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: "linear-gradient(to top, var(--product-card-bg) 8%, color-mix(in oklab, var(--product-card-bg) 55%, transparent) 45%, transparent 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7 md:p-9">
          <p className="truncate text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-[var(--primaryColor)] sm:text-[0.65rem] sm:tracking-[0.35em] rtl:tracking-normal">{cat ? t(cat.name, lang) : ""}</p>
          <h3 className="mt-2 text-[clamp(0.9rem,3.6vw,1.35rem)] font-semibold uppercase leading-[1.08] tracking-[-0.015em] text-[var(--text)] [text-wrap:balance] sm:mt-3 md:text-[clamp(1.35rem,2.6vw,2.5rem)]">
            {t(product.name, lang)}
          </h3>
          <div className="mt-3 h-px w-full bg-[var(--text)]/15 sm:mt-5" />
          <Link
            href={href(`/products/${product.slug}`)}
            className="group pointer-events-auto mt-3 inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] sm:mt-4 rtl:tracking-normal"
          >
            <span className="sr-only sm:not-sr-only">{d.home.viewProduct}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--text)]/25 transition-colors group-hover:border-[var(--primaryColor)] group-hover:text-[var(--primaryColor)]">
              <IconArrowUpRight size={14} stroke={1.8} className="rtl:-scale-x-100" />
            </span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** "A Closer Look": pinned while you scroll; each column swaps pieces in opposite directions. */
export function Spotlight() {
  const { d, href } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const products = productsBySlugs(HOME.spotlight);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const step = useTransform(scrollYProgress, [0.08, 0.92], [0, SLIDES - 1], { clamp: true });
  const left = products.slice(0, SLIDES);
  const right = products.slice(1, SLIDES + 1);

  return (
    <section ref={ref} className="mx-auto h-[calc(100vh+4*40vh)] max-w-[1400px] px-4 md:h-[calc(100vh+4*100vh)] md:px-8">
      <div className="sticky top-20 flex h-[calc(100vh-7rem)] w-full flex-col justify-center gap-4">
        <Reveal className="shrink-0 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{d.home.focusEyebrow}</p>
          <h2 className="text-[1.75rem] font-light leading-tight text-[var(--text)] sm:text-3xl md:text-4xl">
            {d.home.focusTitle1} <span className="font-semibold">{d.home.focusTitle2}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] md:mt-4">{d.home.focusText}</p>
        </Reveal>
        <div className="dark relative flex aspect-square min-h-0 w-full overflow-hidden rounded-[1.5rem] bg-[var(--product-card-bg)] md:max-h-[720px] md:w-auto md:flex-1 md:self-center">
          <div className="relative h-full flex-1 overflow-hidden">
            {left.map((p, i) => (
              <Slide key={p.id} product={p} index={i} step={step} dir={1} />
            ))}
          </div>
          <div className="relative h-full flex-1 overflow-hidden">
            {right.map((p, i) => (
              <Slide key={p.id} product={p} index={i} step={step} dir={-1} />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 justify-center">
          <ButtonLink href={href("/shop")} variant="soft">
            {d.home.focusCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
