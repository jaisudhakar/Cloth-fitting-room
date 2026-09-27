"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GarmentImage } from "@/components/GarmentImage";
import { useI18n } from "@/components/providers/I18nProvider";
import { productById, t } from "@/lib/products";
import { useHydrated, useOrders } from "@/lib/store";

function Success() {
  const { d, f, lang, href, price } = useI18n();
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const order = useOrders((s) => s.orders.find((o) => o.id === id) ?? s.orders[0]);
  if (!hydrated) return null;
  if (!order)
    return (
      <div className="container-x py-24 text-center">
        <p className="text-fg-muted">{d.checkout.noOrder}</p>
        <Link href={href("/")} className="btn-primary mt-6">{d.checkout.backHome}</Link>
      </div>
    );
  return (
    <div className="container-x max-w-2xl py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h1 className="mt-4 font-display text-4xl">{d.checkout.successTitle}</h1>
        <p className="mt-3 text-fg-muted" data-testid="order-confirmation">{f(d.checkout.successText, { id: order.id, email: order.email })}</p>
      </div>
      <div className="mt-10 rounded-3xl bg-surface p-6 ring-1 ring-line">
        <h2 className="font-semibold">{d.checkout.orderDetails}</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.lines.map((l) => {
            const p = productById(l.productId);
            if (!p) return null;
            return (
              <li key={l.key} className="flex items-center gap-3 py-3 text-sm">
                <GarmentImage kind={p.kind} color={l.color} alt="" className="size-14 rounded-lg" />
                <span className="flex-1">
                  {t(p.name, lang)}
                  <span className="block text-xs text-fg-muted">
                    {l.size} × {l.qty}
                  </span>
                </span>
                <span>{price(p.price * l.qty)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>{d.cart.subtotal}</dt><dd>{price(order.totals.subtotal)}</dd></div>
          {order.totals.discount > 0 && <div className="flex justify-between text-success"><dt>{d.cart.discount}</dt><dd>−{price(order.totals.discount)}</dd></div>}
          <div className="flex justify-between"><dt>{d.cart.shipping}</dt><dd>{order.totals.shipping ? price(order.totals.shipping) : d.cart.free}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>{d.cart.total}</dt><dd>{price(order.totals.total)}</dd></div>
        </dl>
      </div>
      <div className="mt-8 text-center">
        <Link href={href("/shop")} className="btn-primary">{d.cart.continue}</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}
