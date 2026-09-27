"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { cartTotals, useCart } from "@/lib/store";
import { useI18n } from "./providers/I18nProvider";

export function PromoField() {
  const { d, f } = useI18n();
  const promo = useCart((s) => s.promo);
  const apply = useCart((s) => s.applyPromo);
  const remove = useCart((s) => s.removePromo);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  if (promo)
    return (
      <p className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
        <span className="inline-flex items-center gap-2">
          <Tag className="size-4" /> {f(d.cart.promoApplied, { code: promo })}
        </span>
        <button onClick={remove} aria-label={d.cart.remove}>
          <X className="size-4" />
        </button>
      </p>
    );
  // Not a <form>: this sits inside the checkout form, and forms can't nest.
  const submit = () => setError(!apply(code));
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={d.cart.promo}
          className="input h-10"
          aria-label={d.cart.promo}
          aria-invalid={error}
        />
        <button type="button" className="btn-outline h-10" onClick={submit}>
          {d.cart.apply}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{d.cart.promoInvalid}</p>}
    </div>
  );
}

export function Totals({ express = false, showShipping = true }: { express?: boolean; showShipping?: boolean }) {
  const { d, price } = useI18n();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const tt = cartTotals(lines, promo, express);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>{d.cart.subtotal}</dt>
        <dd>{price(tt.subtotal)}</dd>
      </div>
      {tt.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>{d.cart.discount}</dt>
          <dd>−{price(tt.discount)}</dd>
        </div>
      )}
      {showShipping && (
        <div className="flex justify-between">
          <dt>{d.cart.shipping}</dt>
          <dd>{tt.shipping === 0 ? d.cart.free : price(tt.shipping)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>{d.cart.total}</dt>
        <dd data-testid="order-total">{price(showShipping ? tt.total : tt.total - tt.shipping)}</dd>
      </div>
    </dl>
  );
}
