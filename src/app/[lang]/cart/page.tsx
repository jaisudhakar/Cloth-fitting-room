"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { CartLineItem, FreeShippingBar } from "@/components/CartLineItem";
import { PromoField, Totals } from "@/components/OrderSummary";
import { useI18n } from "@/components/providers/I18nProvider";
import { cartTotals, useCart, useHydrated } from "@/lib/store";

export default function CartPage() {
  const { d, href } = useI18n();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const totals = cartTotals(lines, promo);

  if (!hydrated) return <div className="container-x py-24 text-center text-fg-muted">{d.common.loading}</div>;
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">{d.cart.title}</h1>
      {lines.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line p-16 text-center">
          <ShoppingBag className="size-10 text-fg-muted" />
          <p className="text-fg-muted">{d.cart.empty}</p>
          <Link href={href("/shop")} className="btn-primary">
            {d.cart.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((l) => (
              <CartLineItem key={l.key} line={l} />
            ))}
          </ul>
          <aside className="h-fit space-y-5 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line lg:sticky lg:top-32">
            <FreeShippingBar subtotal={totals.subtotal - totals.discount} />
            <PromoField />
            <Totals />
            <Link href={href("/checkout")} className="btn-primary h-12 w-full">
              {d.cart.checkout}
            </Link>
            <Link href={href("/shop")} className="block text-center text-sm text-fg-muted underline-offset-4 hover:underline">
              {d.cart.continue}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
