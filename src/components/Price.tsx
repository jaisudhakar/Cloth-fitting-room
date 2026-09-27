"use client";

import { useI18n } from "./providers/I18nProvider";

export function Price({ price, compareAt, className = "" }: { price: number; compareAt?: number; className?: string }) {
  const { price: fmt } = useI18n();
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={compareAt ? "text-accent font-semibold" : "font-semibold"}>{fmt(price)}</span>
      {compareAt ? <s className="text-sm text-fg-muted">{fmt(compareAt)}</s> : null}
    </span>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  const { d, f } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted" aria-label={`${value} / 5`}>
      <span className="relative inline-block leading-none tracking-[0.1em]" aria-hidden>
        <span className="text-line">★★★★★</span>
        <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${(value / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      <span>{value.toFixed(1)}</span>
      {count !== undefined && <span>· {f(d.product.reviews, { n: count })}</span>}
    </span>
  );
}
