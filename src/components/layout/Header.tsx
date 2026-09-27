"use client";

import {
  IconChevronDown,
  IconFlame,
  IconHelpCircle,
  IconMail,
  IconMenu2,
  IconMoon,
  IconPackage,
  IconSearch,
  IconShoppingBag,
  IconSparkles,
  IconStar,
  IconSun,
  IconTag,
  IconTruckDelivery,
  IconUser,
  IconUserPlus,
  IconLogin,
  IconX,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CATEGORIES, t } from "@/lib/catalog";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useCart, useHydrated, useUi } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { BagPopover } from "./BagPopover";

type MenuKey = "shop" | "newArrivals" | "sale";

const THEME_EVENT = "themechange";
const subscribeTheme = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
};

export function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.classList.contains("dark"), () => false);
  const toggle = () => {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", next);
      window.dispatchEvent(new Event(THEME_EVENT));
    };
    // Cross-fade the whole page where supported, as the reference does.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return { dark, toggle };
}

export function Flag({ lang }: { lang: Locale }) {
  if (lang === "ar") {
    return (
      <svg viewBox="0 0 20 14" className="h-3 w-4 rounded-[2px]" aria-hidden>
        <rect width="20" height="14" fill="#0b7a3b" />
        <path d="M5 6.2h10M6 8.2h8" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 14" className="h-3 w-4 rounded-[2px]" aria-hidden>
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#b22234" />
      ))}
      <rect width="9" height="7" fill="#3c3b6e" />
    </svg>
  );
}

export function LangSelect({ up = false, wide = false }: { up?: boolean; wide?: boolean }) {
  const { lang } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const switchTo = (l: Locale) => pathname.replace(new RegExp(`^/${lang}(?=/|$)`), `/${l}`);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-8 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--control-bg)] px-3 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] ${wide ? "w-40 justify-between" : ""}`}
      >
        <span className="flex items-center gap-2">
          <Flag lang={lang} />
          <span className={wide ? "" : "hidden sm:inline"}>{lang.toUpperCase()}</span>
        </span>
        <IconChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""} ${wide ? "" : "max-sm:hidden"}`} />
      </button>
      <div
        role="listbox"
        className={`absolute end-0 z-50 w-36 origin-top-right rounded-xl bg-[var(--surface-elevated)] p-1.5 shadow-lg transition-all duration-200 ${
          up ? "bottom-full mb-2" : "mt-2"
        } ${open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
      >
        {LOCALES.map((l) => (
          <Link
            key={l}
            href={switchTo(l)}
            onClick={() => {
              document.cookie = `lang=${l};path=/;max-age=31536000`;
              setOpen(false);
            }}
            role="option"
            aria-selected={l === lang}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-[var(--surface-hover)] ${l === lang ? "text-[var(--primaryColor)]" : "text-[var(--text)]"}`}
          >
            <Flag lang={l} />
            {l === "en" ? "English" : "العربية"}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function useOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [ref, cb]);
}

const iconBtn =
  "relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--control-bg)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]";

export function Header() {
  const { d, href, lang } = useI18n();
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const [menu, setMenu] = useState<MenuKey | null>(null);
  const [panel, setPanel] = useState<"account" | "bag" | null>(null);
  // Mobile menu remembers which page it was opened on, so navigating closes it.
  const [mobileAt, setMobileAt] = useState<string | null>(null);
  const mobileOpen = mobileAt === pathname;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accountRef = useRef<HTMLDivElement>(null);
  const bagRef = useRef<HTMLDivElement>(null);
  useOutside(accountRef, () => panel === "account" && setPanel(null));
  useOutside(bagRef, () => panel === "bag" && setPanel(null));

  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenu(null);
    setPanel(null);
  }

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", mobileOpen);
  }, [mobileOpen]);

  const links: { key: MenuKey | "home"; label: string; href: string }[] = [
    { key: "home", label: d.nav.home, href: href("/") },
    { key: "shop", label: d.nav.shop, href: href("/shop") },
    { key: "newArrivals", label: d.nav.newArrivals, href: href("/shop?sort=newest") },
    { key: "sale", label: d.nav.sale, href: href("/shop?sale=true") },
  ];

  const openMenu = (k: MenuKey | "home") => {
    clearTimeout(closeTimer.current);
    setMenu(k === "home" ? null : k);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 120);
  };

  const shopLinks = [
    { icon: IconLayoutGrid, label: d.nav.allProducts, href: href("/shop") },
    { icon: IconSparkles, label: d.nav.newArrivals, href: href("/shop?sort=newest") },
    { icon: IconFlame, label: d.nav.bestSellers, href: href("/shop?sort=best_selling") },
    { icon: IconTag, label: d.nav.onSale, href: href("/shop?sale=true") },
    { icon: IconStar, label: d.nav.featured, href: href("/shop?featured=true") },
  ];
  const saleLinks = [shopLinks[3], shopLinks[2], shopLinks[4]];
  const exploreLinks = [
    { icon: IconHelpCircle, label: d.nav.faq, href: href("/faq") },
    { icon: IconTruckDelivery, label: d.nav.trackOrder, href: href("/track-order") },
    { icon: IconMail, label: d.nav.contact, href: href("/contact") },
  ];
  const promos: Record<MenuKey, { image: string; href: string } & (typeof d.nav.promo)["shop"]> = {
    shop: { ...d.nav.promo.shop, image: "/assets/images/nav/shop-promo.jpg", href: href("/shop?sort=newest") },
    newArrivals: { ...d.nav.promo.newArrivals, image: "/assets/images/nav/new-arrivals-promo.jpg", href: href("/shop?sort=newest") },
    sale: { ...d.nav.promo.sale, image: "/assets/images/nav/sale-promo.jpg", href: href("/shop?sale=true") },
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50" onMouseLeave={scheduleClose}>
        <header className="relative z-[60] mx-auto w-full max-w-[1390px] rounded-b-2xl bg-[var(--surface-elevated)] [--text-muted:rgb(58,58,58)] dark:[--text-muted:#b3b4b5]">
          <div className="mx-auto w-full px-4 md:px-8">
            <nav className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center">
                <button
                  className="p-2 text-[var(--text)] transition-opacity hover:opacity-70 md:hidden"
                  aria-label={mobileOpen ? d.nav.closeMenu : d.nav.openMenu}
                  onClick={() => setMobileAt(mobileOpen ? null : pathname)}
                >
                  {mobileOpen ? <IconX size={22} stroke={1.6} /> : <IconMenu2 size={22} stroke={1.6} />}
                </button>
                <div className="hidden items-center gap-6 md:flex lg:gap-8">
                  {links.map((l) => (
                    <div key={l.key} onMouseEnter={() => openMenu(l.key)}>
                      <Link
                        href={l.href}
                        className={`whitespace-nowrap text-xs font-medium uppercase tracking-wide outline-none transition-colors hover:text-[var(--primaryColor)] focus-visible:text-[var(--primaryColor)] lg:text-sm ${
                          menu === l.key ? "text-[var(--primaryColor)]" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <Link href={href("/")} className="whitespace-nowrap text-xl font-bold uppercase tracking-[0.3em] text-[var(--text)] lg:text-2xl" onMouseEnter={scheduleClose}>
                {d.brand}
              </Link>
              <div className="flex items-center justify-end gap-2" onMouseEnter={scheduleClose}>
                <LangSelect />
                <button type="button" className={`${iconBtn} text-[var(--text)]`} onClick={toggle} aria-label={d.nav.theme}>
                  {hydrated && dark ? <IconSun size={18} stroke={1.6} /> : <IconMoon size={18} stroke={1.6} />}
                </button>
                <div className="hidden items-center gap-2 md:flex">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex h-8 w-[150px] items-center justify-between rounded-full border border-[var(--border-subtle)] bg-[var(--control-bg)] px-3 text-sm hover:bg-[var(--surface-hover)]"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[var(--text-muted)]">
                      <IconSearch size={16} stroke={1.8} className="shrink-0 text-[var(--text)]" />
                      <span className="truncate">{d.nav.search}</span>
                    </span>
                    <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">Ctrl+K</kbd>
                  </button>
                  <div className="relative" ref={accountRef}>
                    <button type="button" className={iconBtn} aria-label={d.nav.account} aria-expanded={panel === "account"} onClick={() => setPanel(panel === "account" ? null : "account")}>
                      <IconUser size={18} stroke={1.6} />
                    </button>
                    <div
                      role="menu"
                      className={`absolute end-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-[var(--surface-elevated)] p-1.5 shadow-lg transition-all duration-200 ${
                        panel === "account" ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                      }`}
                    >
                      <Link role="menuitem" href={href("/account")} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)]">
                        <IconLogin size={16} stroke={1.6} /> {d.nav.signIn}
                      </Link>
                      <Link role="menuitem" href={href("/account?create=1")} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-hover)]">
                        <IconUserPlus size={16} stroke={1.6} /> {d.nav.createAccount}
                      </Link>
                    </div>
                  </div>
                  <div className="relative" ref={bagRef}>
                    <button type="button" className={iconBtn} aria-label={d.nav.cart} aria-expanded={panel === "bag"} onClick={() => setPanel(panel === "bag" ? null : "bag")} data-testid="bag-button">
                      <IconShoppingBag size={18} stroke={1.6} />
                      {hydrated && count > 0 && (
                        <motion.span
                          key={count}
                          initial={{ scale: 0.4 }}
                          animate={{ scale: 1 }}
                          className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primaryColor)] px-1 text-[10px] font-semibold text-white"
                        >
                          {count}
                        </motion.span>
                      )}
                    </button>
                    <BagPopover open={panel === "bag"} onClose={() => setPanel(null)} />
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Mega menu: grows open with a grid-rows transition and cross-fades between items. */}
          <div
            className={`absolute top-full hidden w-[min(980px,92vw)] translate-y-2 overflow-hidden rounded-2xl bg-[var(--surface-elevated)] shadow-xl transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:grid ${
              menu ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
            }`}
            style={{ insetInlineStart: 0 }}
            onMouseEnter={() => clearTimeout(closeTimer.current)}
          >
            <div className="overflow-hidden">
              <div className="grid px-8 py-8 [&>*]:col-start-1 [&>*]:row-start-1">
                {(Object.keys(promos) as MenuKey[]).map((k) => {
                  const promo = promos[k];
                  const lists =
                    k === "shop"
                      ? [
                          { title: d.nav.shop, items: shopLinks },
                          { title: d.nav.categories, categories: true },
                          { title: d.nav.explore, items: exploreLinks },
                        ]
                      : [
                          { title: k === "sale" ? d.nav.sale : d.nav.shop, items: k === "sale" ? saleLinks : shopLinks },
                          { title: d.nav.explore, items: exploreLinks },
                        ];
                  return (
                    <div key={k} className={`transition-opacity duration-200 ${menu === k ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={menu !== k}>
                      <div className={`grid gap-6 ${k === "shop" ? "grid-cols-[1.6fr_1fr]" : "grid-cols-[1.4fr_1fr]"}`}>
                        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${lists.length}, minmax(0, 1fr))` }}>
                          {lists.map((list) => (
                            <div key={list.title}>
                              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{list.title}</h3>
                              <ul className="space-y-1">
                                {"categories" in list
                                  ? CATEGORIES.filter((c) => c.slug !== "hats").map((c) => (
                                      <li key={c.slug}>
                                        <Link
                                          href={href(`/shop?category=${c.slug}`)}
                                          tabIndex={menu === k ? 0 : -1}
                                          className="flex items-center gap-3 rounded-full py-1.5 pe-3 ps-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                                        >
                                          <Image src={c.image} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full bg-[var(--primaryColor)]/10 object-cover" />
                                          <span className="truncate">{t(c.name, lang)}</span>
                                        </Link>
                                      </li>
                                    ))
                                  : list.items!.map((it) => (
                                      <li key={it.label}>
                                        <Link
                                          href={it.href}
                                          tabIndex={menu === k ? 0 : -1}
                                          className="flex items-center gap-3 rounded-full py-1.5 pe-3 ps-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                                        >
                                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primaryColor)]/10 text-[var(--accent-text)]">
                                            <it.icon size={16} stroke={1.6} />
                                          </span>
                                          <span className="truncate">{it.label}</span>
                                        </Link>
                                      </li>
                                    ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <Link href={promo.href} tabIndex={menu === k ? 0 : -1} className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-xl p-5">
                          <Image src={promo.image} alt="" fill sizes="360px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 transition-colors duration-300 group-hover:from-black/90 group-hover:via-black/50" />
                          <div className="relative">
                            <p className="mb-1 text-xs uppercase tracking-wider text-white/70">{promo.eyebrow}</p>
                            <p className="mb-3 text-xl font-semibold leading-tight text-white">{promo.title}</p>
                            <span className="text-sm font-medium text-white underline underline-offset-4">{promo.cta}</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-x-0 top-full z-50 h-[calc(100dvh-4rem)] overflow-y-auto bg-[var(--surface-elevated)] md:hidden"
              >
                <div className="flex min-h-full flex-col px-6 pb-10 pt-8">
                  <nav className="flex flex-col">
                    {links.map((l, i) => (
                      <motion.div key={l.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i + 0.05 }}>
                        <Link href={l.href} className="block py-3 text-2xl font-light tracking-tight text-[var(--text)] transition-colors hover:text-[var(--primaryColor)]">
                          {l.label}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                  <div className="mt-auto flex flex-col gap-4 border-t border-[var(--border)] pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileAt(null);
                        setSearchOpen(true);
                      }}
                      className="flex items-center gap-3 py-1 text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                    >
                      <IconSearch size={18} stroke={1.6} /> {d.nav.search}
                    </button>
                    <Link href={href("/account")} className="flex items-center gap-3 py-1 text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text)]">
                      <IconUser size={18} stroke={1.6} /> {d.nav.account}
                    </Link>
                    <Link href={href("/cart")} className="flex items-center gap-3 py-1 text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text)]">
                      <IconPackage size={18} stroke={1.6} /> {d.nav.cart}
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>
      {/* Page dim behind the open mega menu */}
      <div
        className={`fixed inset-0 z-40 hidden bg-black/40 transition-opacity duration-300 md:block ${menu ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onMouseEnter={scheduleClose}
        aria-hidden
      />
    </>
  );
}
