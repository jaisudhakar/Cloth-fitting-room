"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { type Dictionary, type Locale, fmt, formatPrice } from "@/lib/i18n";

type I18n = {
  lang: Locale;
  d: Dictionary;
  /** Prefix a path with the current locale. */
  href: (path: string) => string;
  price: (n: number) => string;
  f: typeof fmt;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: React.ReactNode }) {
  const href = useCallback((path: string) => `/${lang}${path === "/" ? "" : path}`, [lang]);
  const price = useCallback((n: number) => formatPrice(n, lang), [lang]);
  const value = useMemo(() => ({ lang, d: dict, href, price, f: fmt }), [lang, dict, href, price]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
