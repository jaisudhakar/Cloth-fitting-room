"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { productById, t } from "@/lib/products";
import { type CartLine, useCart } from "@/lib/store";
import { GarmentImage } from "./GarmentImage";
import { useI18n } from "./providers/I18nProvider";

export function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { lang, d, href, price } = useI18n();
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const p = productById(line.productId);
  if (!p) return null;
  const color = p.colors.find((c) => c.hex === line.color) ?? p.colors[0];
  const name = t(p.name, lang);
  return (
    <li className="flex gap-4 py-4" data-testid="cart-line">
      <Link href={href(`/product/${p.slug}?color=${encodeURIComponent(color.hex)}`)} className="shrink-0">
        <GarmentImage kind={p.kind} color={color.hex} alt={name} className={`${compact ? "size-20" : "size-28"} rounded-xl`} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <Link href={href(`/product/${p.slug}`)} className="truncate text-sm font-medium hover:underline">
            {name}
          </Link>
          <span className="shrink-0 text-sm font-semibold">{price(p.price * line.qty)}</span>
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">
          {t(color.name, lang)} · {d.product.size} {line.size}
          {line.qty > 1 && ` · ${price(p.price)} ${d.common.each}`}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex items-center rounded-full border border-line">
            <button className="icon-btn size-8" onClick={() => setQty(line.key, line.qty - 1)} aria-label="-" disabled={line.qty <= 1}>
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums" aria-label={d.product.quantity}>
              {line.qty}
            </span>
            <button className="icon-btn size-8" onClick={() => setQty(line.key, line.qty + 1)} aria-label="+" disabled={line.qty >= 10}>
              <Plus className="size-3.5" />
            </button>
          </div>
          <button className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-danger" onClick={() => remove(line.key)}>
            <Trash2 className="size-3.5" />
            {d.cart.remove}
          </button>
        </div>
      </div>
    </li>
  );
}

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { d, f } = useI18n();
  const left = Math.max(0, 100 - subtotal);
  return (
    <div className="rounded-xl bg-muted p-3 text-xs">
      <p>{left > 0 ? f(d.cart.freeShippingProgress, { n: left.toFixed(0) }) : d.cart.freeShippingDone}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, subtotal)}%` }} />
      </div>
    </div>
  );
}
