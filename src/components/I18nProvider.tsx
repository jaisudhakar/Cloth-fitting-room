"use client";

import { createContext, useContext, useMemo } from "react";
import { type Dictionary, type Locale, fmt, formatPrice } from "@/lib/i18n";

type I18n = {
  lang: Locale;
  d: Dictionary;
  /** Prefix a path with the current locale. */
  href: (path: string) => string;
  price: (n: number, decimals?: boolean) => string;
  f: typeof fmt;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: React.ReactNode }) {
  const value = useMemo<I18n>(
    () => ({ lang, d: dict, href: (p) => `/${lang}${p === "/" ? "" : p}`, price: formatPrice, f: fmt }),
    [lang, dict],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
