"use client";

import { IconArrowRight, IconCircleCheck, IconRefresh, IconShieldCheck, IconTruckDelivery } from "@tabler/icons-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useI18n } from "../I18nProvider";
import { ButtonLink } from "../ui/Button";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const { d, href } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Slow parallax drift on the photo while the hero scrolls away.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.35]);
  const item = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease, delay: 0.15 + i * 0.12 },
  });

  return (
    <section
      ref={ref}
      className="relative m-auto flex h-[56vh] max-h-[540px] min-h-[420px] max-w-[1390px] items-end overflow-hidden rounded-3xl md:h-[90vh] md:max-h-[600px] md:min-h-0"
    >
      <motion.div className="absolute inset-0" style={{ y }} initial={reduce ? false : { scale: 1.15 }} animate={{ scale: 1.05 }} transition={{ duration: 1.8, ease }}>
        <Image src="/assets/images/home/homepage-hero-light.jpg" alt="" fill priority sizes="(max-width: 1390px) 100vw, 1390px" className="object-cover object-center transition-[filter] duration-700 rtl:-scale-x-100 dark:[filter:brightness(0.24)_sepia(0.5)_saturate(1.2)_contrast(1.2)]" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/65 to-white/15 md:from-white/30 md:via-transparent md:to-transparent dark:from-black/90 dark:via-black/50 dark:to-black/10 md:dark:from-black/60 md:dark:via-black/10 md:dark:to-transparent" />
      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto w-full max-w-[1390px] px-5 pb-20 sm:px-6 sm:pb-28 md:px-12 md:pb-28">
        <motion.p {...item(0)} className="mb-4 text-[0.65rem] font-light uppercase tracking-[0.35em] text-black/60 dark:text-white/70 sm:mb-5 sm:text-xs sm:tracking-[0.5em] md:text-sm rtl:tracking-normal">
          {d.home.heroEyebrow}
        </motion.p>
        <h1 className="text-5xl font-extralight leading-[0.85] tracking-[-0.03em] text-black dark:text-white sm:text-7xl md:text-8xl lg:text-9xl rtl:text-4xl rtl:leading-[1.25] rtl:tracking-normal sm:rtl:text-6xl md:rtl:text-7xl lg:rtl:text-8xl">
          <motion.span {...item(1)} className="block">
            {d.home.heroTitle1}
          </motion.span>
          <motion.span {...item(2)} className="block font-semibold italic">
            {d.home.heroTitle2}
          </motion.span>
        </h1>
        <motion.p {...item(3)} className="mt-5 max-w-md text-sm font-light leading-relaxed text-black/60 sm:mt-6 sm:text-base md:mt-8 md:text-lg rtl:max-w-lg dark:text-white/70">
          {d.home.heroText}
        </motion.p>
        <motion.div {...item(4)} className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4 md:mt-10">
          <ButtonLink href={href("/shop")}>
            {d.home.shopNow}
            <IconArrowRight size={16} stroke={1.8} className="rtl:-scale-x-100" />
          </ButtonLink>
          <ButtonLink href={href("/shop?sort=newest")} variant="outline" className="!border-black/10 !text-black hover:!bg-black/5 dark:!border-white/25 dark:!text-white dark:hover:!bg-white/10">
            {d.home.newArrivals}
          </ButtonLink>
        </motion.div>
      </motion.div>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <motion.div
          className="h-8 w-px bg-gradient-to-b from-transparent to-black/30 dark:to-white/40"
          animate={reduce ? undefined : { scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </section>
  );
}

const SERVICE_ICONS = [IconTruckDelivery, IconRefresh, IconShieldCheck, IconCircleCheck];

export function ServiceStrip() {
  const { d } = useI18n();
  const items = d.home.services.map((s, i) => ({ ...s, Icon: SERVICE_ICONS[i] }));
  const cell = (s: (typeof items)[number], i: number, marquee: boolean) => (
    <div key={i} className={marquee ? "shrink-0 border-e border-[var(--border)]" : "flex items-center gap-3 border-[var(--border)] px-5 py-5 md:px-6 [&:not(:last-child)]:border-e"}>
      <div className={marquee ? "flex items-center gap-2.5 px-5 py-4" : "contents"}>
        <s.Icon size={22} stroke={1.5} className="shrink-0 text-[var(--primaryColor)]" />
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[0.8rem] font-semibold leading-tight text-[var(--text)] sm:text-sm">{s.title}</p>
          <p className="mt-0.5 whitespace-nowrap text-[0.68rem] leading-tight text-[var(--text-muted)] sm:text-xs">{s.text}</p>
        </div>
      </div>
    </div>
  );
  return (
    <section className="relative z-20 h-0 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease }}
        className="mx-auto max-w-[1100px] -translate-y-1/2 overflow-hidden rounded-2xl bg-[var(--product-card-bg)]"
      >
        <div className="overflow-hidden md:hidden">
          <div className="flex w-max animate-marquee motion-reduce:animate-none">{[...items, ...items].map((s, i) => cell(s, i, true))}</div>
        </div>
        <div className="hidden md:grid md:grid-cols-4">{items.map((s, i) => cell(s, i, false))}</div>
      </motion.div>
    </section>
  );
}
