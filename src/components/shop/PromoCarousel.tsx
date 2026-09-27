"use client";

import { IconArrowRight, IconChevronRight, IconHome } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "../I18nProvider";
import { ButtonLink } from "../ui/Button";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const { href } = useI18n();
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      <Link href={href("/")} className="text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="Home">
        <IconHome size={16} stroke={1.6} />
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          <IconChevronRight size={14} className="text-[var(--text-muted)] rtl:-scale-x-100" />
          {it.href ? (
            <Link href={it.href} className="text-[var(--text-muted)] opacity-80 hover:text-[var(--text)]">
              {it.label}
            </Link>
          ) : (
            <span className="text-[var(--text)]">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

type Slide = { eyebrow: string; title: string; text: string; cta: string; href: string; image: string };

/** Dark hero banner that cycles through promos with a Ken Burns zoom and pill-shaped dots. */
export function PromoCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [paused, slides.length]);
  const s = slides[i];
  return (
    <div
      className="relative h-[260px] overflow-hidden rounded-[1.5rem] bg-black sm:h-[300px] md:h-[340px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <motion.div className="absolute inset-0 start-[30%]" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: "linear" }}>
            <Image src={s.image} alt="" fill sizes="(max-width: 1400px) 100vw, 1400px" className="object-cover" priority={i === 0} />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent rtl:bg-gradient-to-l" />
          <div className="relative flex h-full max-w-xl flex-col justify-center px-6 sm:px-10">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[11px] uppercase tracking-[0.3em] text-white/70 rtl:tracking-normal">
              {s.eyebrow}
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 text-2xl font-semibold text-white sm:text-[2rem]">
              {s.title}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3 text-sm text-white/80 sm:text-base">
              {s.text}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
              <ButtonLink href={s.href}>
                {s.cta}
                <IconArrowRight size={16} stroke={1.8} className="rtl:-scale-x-100" />
              </ButtonLink>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      {slides.length > 1 && (
        <div className="absolute bottom-5 end-6 z-10 flex items-center gap-1.5">
          {slides.map((sl, n) => (
            <button
              key={sl.title}
              onClick={() => setI(n)}
              aria-label={sl.title}
              aria-current={n === i}
              className={`h-1.5 rounded-full transition-all duration-500 ${n === i ? "w-6 bg-[var(--primaryColor)]" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
