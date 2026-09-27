"use client";

import { Heart, Menu, Moon, Search, ShoppingBag, Shirt, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { LOCALES } from "@/lib/i18n";
import { useCart, useHydrated, useUi, useWishlist } from "@/lib/store";
import { useI18n } from "./providers/I18nProvider";

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -end-0.5 -top-0.5 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
      {n}
    </span>
  );
}

const THEME_EVENT = "themechange";
const subscribeTheme = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
};

function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.classList.contains("dark"), () => false);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new Event(THEME_EVENT));
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return { dark, toggle };
}

export function Header() {
  const { d, lang, href } = useI18n();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const { dark, toggle } = useTheme();
  // Remember which page the menu was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (open: boolean) => setMenuPath(open ? pathname : null);

  const other = LOCALES.find((l) => l !== lang)!;
  const switchHref = pathname.replace(new RegExp(`^/${lang}(?=/|$)`), `/${other}`);

  const links = [
    { href: href("/shop"), label: d.nav.shop },
    { href: href("/shop?gender=women"), label: d.nav.women },
    { href: href("/shop?gender=men"), label: d.nav.men },
    { href: href("/shop?sale=1"), label: d.nav.sale },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-primary px-4 py-2 text-center text-xs text-primary-fg">{d.announcement}</div>
      <div className="border-b border-line bg-bg/90 backdrop-blur">
        <div className="container-x flex h-16 items-center gap-4">
          <button className="icon-btn lg:hidden" onClick={() => setMenuOpen(true)} aria-label={d.nav.menu}>
            <Menu className="size-5" />
          </button>
          <Link href={href("/")} className="font-display text-2xl font-semibold tracking-tight">
            {d.brand}
          </Link>
          <nav className="ms-8 hidden items-center gap-7 text-sm lg:flex">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="text-fg-muted transition hover:text-fg">
                {l.label}
              </Link>
            ))}
            <Link
              href={href("/fitting-room")}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 font-medium text-accent transition hover:bg-accent/20"
            >
              <Shirt className="size-4" />
              {d.nav.fittingRoom}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-0.5">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={d.nav.search}>
              <Search className="size-5" />
            </button>
            <button className="icon-btn" onClick={toggle} aria-label={d.nav.theme}>
              {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <Link
              href={switchHref}
              onClick={() => (document.cookie = `lang=${other};path=/;max-age=31536000`)}
              className="icon-btn w-auto px-3 text-sm font-medium"
              hrefLang={other}
            >
              {d.nav.language}
            </Link>
            <Link href={href("/wishlist")} className="icon-btn max-sm:hidden" aria-label={d.nav.wishlist}>
              <Heart className="size-5" />
              <Badge n={hydrated ? wishCount : 0} />
            </Link>
            <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label={d.nav.cart} data-testid="cart-button">
              <ShoppingBag className="size-5" />
              <Badge n={hydrated ? cartCount : 0} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={d.nav.menu}>
          <div className="fade-in absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col gap-1 bg-bg p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-2xl font-semibold">{d.brand}</span>
              <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label={d.nav.close}>
                <X className="size-5" />
              </button>
            </div>
            <Link href={href("/")} className="rounded-xl px-3 py-3 hover:bg-muted">
              {d.nav.home}
            </Link>
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="rounded-xl px-3 py-3 hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <Link href={href("/wishlist")} className="rounded-xl px-3 py-3 hover:bg-muted">
              {d.nav.wishlist}
            </Link>
            <Link href={href("/fitting-room")} className="btn-accent mt-4">
              <Shirt className="size-4" />
              {d.nav.fittingRoom}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
