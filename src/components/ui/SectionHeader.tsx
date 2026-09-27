"use client";

import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { Reveal } from "./Reveal";

/** Eyebrow + two-weight heading (+ optional "View All"), as used across the home page. */
export function SectionHeader({
  eyebrow,
  light,
  bold,
  text,
  viewAll,
  center = false,
}: {
  eyebrow: string;
  light: string;
  bold: string;
  text?: string;
  viewAll?: { href: string; label: string };
  center?: boolean;
}) {
  if (center) {
    return (
      <Reveal className="mx-auto mb-8 max-w-xl text-center md:mb-12">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{eyebrow}</p>
        <h2 className="text-[1.75rem] font-light leading-tight text-[var(--text)] sm:text-3xl md:text-4xl">
          {light} <span className="font-semibold">{bold}</span>
        </h2>
        {text && <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] md:mt-4">{text}</p>}
      </Reveal>
    );
  }
  return (
    <Reveal className="mb-7 flex flex-col items-start gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-6">
      <div className="min-w-0">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--accent-text)] rtl:tracking-normal">{eyebrow}</p>
        <h2 className="text-[1.75rem] font-light leading-tight text-[var(--text)] sm:text-3xl md:text-4xl">
          {light} <span className="font-semibold">{bold}</span>
        </h2>
      </div>
      {viewAll && <ViewAll {...viewAll} />}
    </Reveal>
  );
}

export function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex shrink-0 items-center text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
      {label}
      <IconArrowRight size={16} stroke={1.8} className="ms-2 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
    </Link>
  );
}
