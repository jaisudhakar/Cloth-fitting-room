"use client";

import { CreditCard, Lock, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GarmentImage } from "@/components/GarmentImage";
import { PromoField, Totals } from "@/components/OrderSummary";
import { useI18n } from "@/components/providers/I18nProvider";
import { productById, t } from "@/lib/products";
import { EXPRESS_COST, cartTotals, useCart, useHydrated, useOrders } from "@/lib/store";

type Fields = Record<
  "email" | "phone" | "firstName" | "lastName" | "address" | "city" | "country" | "postal" | "cardNumber" | "expiry" | "cvc" | "nameOnCard",
  string
>;

const EMPTY: Fields = {
  email: "", phone: "", firstName: "", lastName: "", address: "", city: "", country: "", postal: "",
  cardNumber: "", expiry: "", cvc: "", nameOnCard: "",
};

function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

const now = () => Date.now();
const newOrderId = () => `VS-${now().toString(36).toUpperCase().slice(-6)}`;

export default function CheckoutPage() {
  const { d, f, lang, href, price } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const clear = useCart((s) => s.clear);
  const place = useOrders((s) => s.place);
  const [v, setV] = useState<Fields>(EMPTY);
  const [express, setExpress] = useState(false);
  const [pay, setPay] = useState<"card" | "cod">("card");
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [placing, setPlacing] = useState(false);
  const totals = cartTotals(lines, promo, express);

  if (!hydrated) return <div className="container-x py-24 text-center text-fg-muted">{d.common.loading}</div>;
  if (!lines.length)
    return (
      <div className="container-x flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-fg-muted">{d.cart.empty}</p>
        <Link href={href("/shop")} className="btn-primary">{d.cart.emptyCta}</Link>
      </div>
    );

  const validate = () => {
    const e: typeof errors = {};
    const req: (keyof Fields)[] = ["email", "firstName", "lastName", "address", "city", "country", "postal"];
    if (pay === "card") req.push("cardNumber", "expiry", "cvc", "nameOnCard");
    for (const k of req) if (!v[k].trim()) e[k] = d.checkout.required;
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = d.checkout.invalidEmail;
    if (pay === "card") {
      if (v.cardNumber && !luhn(v.cardNumber)) e.cardNumber = d.checkout.invalidCard;
      if (v.expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.expiry)) e.expiry = d.checkout.invalidExpiry;
      if (v.cvc && !/^\d{3,4}$/.test(v.cvc)) e.cvc = d.checkout.invalidCvc;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    const id = newOrderId();
    place({ id, email: v.email, name: `${v.firstName} ${v.lastName}`, lines, totals, createdAt: now() });
    clear();
    router.push(href(`/checkout/success?id=${id}`));
  };

  const field = (k: keyof Fields, opts: { type?: string; autoComplete?: string; placeholder?: string; inputMode?: "numeric"; className?: string; format?: (s: string) => string } = {}) => (
    <label className={`text-sm ${opts.className ?? ""}`}>
      {d.checkout[k]}
      <input
        name={k}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        inputMode={opts.inputMode}
        placeholder={opts.placeholder}
        value={v[k]}
        onChange={(e) => setV((s) => ({ ...s, [k]: opts.format ? opts.format(e.target.value) : e.target.value }))}
        aria-invalid={!!errors[k]}
        className="input mt-1.5"
      />
      {errors[k] && <span className="mt-1 block text-xs text-danger">{errors[k]}</span>}
    </label>
  );

  const cardFormat = (s: string) => s.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  const expiryFormat = (s: string) => {
    const n = s.replace(/\D/g, "").slice(0, 4);
    return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
  };

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">{d.checkout.title}</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold">{d.checkout.contact}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("email", { type: "email", autoComplete: "email" })}
              {field("phone", { type: "tel", autoComplete: "tel" })}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold">{d.checkout.delivery}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("firstName", { autoComplete: "given-name" })}
              {field("lastName", { autoComplete: "family-name" })}
              {field("address", { autoComplete: "street-address", className: "sm:col-span-2" })}
              {field("city", { autoComplete: "address-level2" })}
              {field("postal", { autoComplete: "postal-code" })}
              {field("country", { autoComplete: "country-name", className: "sm:col-span-2" })}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold">{d.checkout.method}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: false, label: d.checkout.standard, cost: cartTotals(lines, promo, false).shipping },
                { id: true, label: d.checkout.express, cost: EXPRESS_COST },
              ].map((m) => (
                <label key={String(m.id)} className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-sm ${express === m.id ? "border-fg" : "border-line"}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="ship" checked={express === m.id} onChange={() => setExpress(m.id)} className="accent-[var(--accent)]" />
                    {m.label}
                  </span>
                  <span className="font-medium">{m.cost === 0 ? d.cart.free : price(m.cost)}</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {d.checkout.payment} <Lock className="size-4 text-fg-muted" />
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["card", d.checkout.card, CreditCard],
                ["cod", d.checkout.cod, Wallet],
              ] as const).map(([id, label, Icon]) => (
                <button type="button" key={id} className="chip h-12 gap-2 rounded-2xl" aria-pressed={pay === id} onClick={() => setPay(id)}>
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            {pay === "card" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field("cardNumber", { inputMode: "numeric", autoComplete: "cc-number", placeholder: "4242 4242 4242 4242", className: "sm:col-span-2", format: cardFormat })}
                {field("expiry", { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "MM/YY", format: expiryFormat })}
                {field("cvc", { inputMode: "numeric", autoComplete: "cc-csc", placeholder: "123", format: (s) => s.replace(/\D/g, "").slice(0, 4) })}
                {field("nameOnCard", { autoComplete: "cc-name", className: "sm:col-span-2" })}
              </div>
            )}
            <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-fg-muted">{d.checkout.demoNote}</p>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line lg:sticky lg:top-32">
          <h2 className="font-semibold">{d.checkout.summary}</h2>
          <ul className="max-h-72 space-y-3 overflow-y-auto">
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              return (
                <li key={l.key} className="flex items-center gap-3 text-sm">
                  <span className="relative">
                    <GarmentImage kind={p.kind} color={l.color} alt="" className="size-14 rounded-lg" />
                    <span className="absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-fg-muted text-[10px] text-bg">{l.qty}</span>
                  </span>
                  <span className="flex-1">
                    <span className="block">{t(p.name, lang)}</span>
                    <span className="text-xs text-fg-muted">{l.size}</span>
                  </span>
                  <span>{price(p.price * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <PromoField />
          <Totals express={express} />
          <button className="btn-primary h-12 w-full" disabled={placing} data-testid="place-order">
            {placing ? d.checkout.placing : f(d.checkout.placeOrder, { total: price(totals.total) })}
          </button>
        </aside>
      </form>
    </div>
  );
}
