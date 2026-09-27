"use client";

import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cartTotals, useCart, useUi } from "@/lib/store";
import { CartLineItem, FreeShippingBar } from "./CartLineItem";
import { useI18n } from "./providers/I18nProvider";

export function CartDrawer() {
  const { d, f, href, price } = useI18n();
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const pathname = usePathname();
  const totals = cartTotals(lines, promo);

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={d.cart.title}>
      <div className="fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="drawer-end absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">
            {d.cart.title} <span className="text-sm text-fg-muted">({f(d.cart.items, { n: totals.count })})</span>
          </h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label={d.nav.close}>
            <X className="size-5" />
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="size-10 text-fg-muted" />
            <p className="text-fg-muted">{d.cart.empty}</p>
            <Link href={href("/shop")} className="btn-primary">
              {d.cart.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingBar subtotal={totals.subtotal - totals.discount} />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <CartLineItem key={l.key} line={l} compact />
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex justify-between text-sm">
                <span>{d.cart.subtotal}</span>
                <span className="font-semibold">{price(totals.subtotal)}</span>
              </div>
              <p className="text-xs text-fg-muted">
                {d.cart.shipping}: {d.cart.calculatedAtCheckout}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href={href("/cart")} className="btn-outline">
                  {d.cart.viewBag}
                </Link>
                <Link href={href("/checkout")} className="btn-primary" data-testid="drawer-checkout">
                  {d.cart.checkout}
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
