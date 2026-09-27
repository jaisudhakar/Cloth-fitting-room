"use client";

import { IconCash, IconCircleCheck, IconCreditCard, IconLock } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { productById, t } from "@/lib/catalog";
import { cartTotals, useAccount, useCart, useHydrated } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { Breadcrumbs } from "../shop/PromoCarousel";
import { Button, ButtonLink } from "../ui/Button";
import { EmptyState } from "./Cart";
import { IconShoppingBag } from "@tabler/icons-react";

const FIELDS = ["email", "phone", "firstName", "lastName", "address", "city", "zip", "country"] as const;
type Field = (typeof FIELDS)[number] | "cardNumber" | "expiry" | "cvc";

function luhn(n: string) {
  const s = n.replace(/\D/g, "");
  if (s.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    let v = Number(s[s.length - 1 - i]);
    if (i % 2) v = v * 2 > 9 ? v * 2 - 9 : v * 2;
    sum += v;
  }
  return sum % 10 === 0;
}

const newOrderId = () => `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

export function Checkout() {
  const { d, f, lang, href, price } = useI18n();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const clear = useCart((s) => s.clear);
  const addOrder = useAccount((s) => s.addOrder);
  const [pay, setPay] = useState<"card" | "cod">("card");
  const [values, setValues] = useState<Record<Field, string>>(() => Object.fromEntries([...FIELDS, "cardNumber", "expiry", "cvc"].map((k) => [k, ""])) as Record<Field, string>);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ id: string; email: string } | null>(null);
  const tt = cartTotals(lines, promo);

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (done)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }} className="text-[var(--primaryColor)]">
          <IconCircleCheck size={64} stroke={1.4} />
        </motion.span>
        <h1 className="mt-6 text-3xl font-semibold">{d.checkout.successTitle}</h1>
        <p className="mt-3 text-[var(--text-muted)]" data-testid="order-confirmation">
          {f(d.checkout.successText, done)}
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink href={href(`/track-order?order=${done.id}`)} variant="outline">
            {d.checkout.trackIt}
          </ButtonLink>
          <ButtonLink href={href("/shop")}>{d.cart.continue}</ButtonLink>
        </div>
      </motion.div>
    );
  if (!lines.length) return <EmptyState icon={IconShoppingBag} title={d.cart.empty} text={d.cart.emptyText} cta={{ href: href("/shop"), label: d.cart.continue }} />;

  const set = (k: Field, v: string) => setValues((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    for (const k of FIELDS) if (k !== "phone" && !values[k].trim()) errs[k] = d.checkout.required;
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) errs.email = d.checkout.invalid;
    if (pay === "card") {
      if (!luhn(values.cardNumber)) errs.cardNumber = d.checkout.invalid;
      if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(values.expiry)) errs.expiry = d.checkout.invalid;
      if (!/^\d{3,4}$/.test(values.cvc)) errs.cvc = d.checkout.invalid;
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    const id = newOrderId();
    addOrder({ id, email: values.email, lines, total: tt.total, createdAt: Date.now() });
    clear();
    setDone({ id, email: values.email });
  };

  const input = (k: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = false) => (
    <label className={`text-sm ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[var(--text-muted)]">{label}</span>
      <input
        name={k}
        value={values[k]}
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={!!errors[k]}
        className="h-11 w-full rounded-full border border-[var(--input-border)]/60 bg-[var(--input-bg)] px-4 outline-none transition-colors focus:border-[var(--primaryColor)] aria-[invalid=true]:border-[var(--danger)]"
        {...props}
      />
      {errors[k] && <span className="mt-1 block text-xs text-[var(--danger)]">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: d.cart.title, href: href("/cart") }, { label: d.checkout.title }]} />
      <h1 className="text-2xl font-semibold md:text-[2rem]">{d.checkout.title}</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-6">
            <h2 className="mb-4 font-semibold">{d.checkout.contact}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {input("email", d.checkout.email, { type: "email", autoComplete: "email" })}
              {input("phone", d.checkout.phone, { type: "tel", autoComplete: "tel" })}
            </div>
          </section>
          <section className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-6">
            <h2 className="mb-4 font-semibold">{d.checkout.shipping}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {input("firstName", d.checkout.firstName, { autoComplete: "given-name" })}
              {input("lastName", d.checkout.lastName, { autoComplete: "family-name" })}
              {input("address", d.checkout.address, { autoComplete: "street-address" }, true)}
              {input("city", d.checkout.city, { autoComplete: "address-level2" })}
              {input("zip", d.checkout.zip, { autoComplete: "postal-code" })}
              {input("country", d.checkout.country, { autoComplete: "country-name" }, true)}
            </div>
          </section>
          <section className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              {d.checkout.payment} <IconLock size={15} className="text-[var(--text-muted)]" />
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["card", d.checkout.card, IconCreditCard],
                  ["cod", d.checkout.cod, IconCash],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setPay(k)}
                  aria-pressed={pay === k}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--border)] text-sm transition-colors aria-pressed:border-[var(--primaryColor)] aria-pressed:bg-[var(--primaryColor)]/10 aria-pressed:text-[var(--accent-text)]"
                >
                  <Icon size={18} stroke={1.6} /> {label}
                </button>
              ))}
            </div>
            {pay === "card" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {input("cardNumber", d.checkout.cardNumber, { inputMode: "numeric", autoComplete: "cc-number", placeholder: "4242 4242 4242 4242" }, true)}
                {input("expiry", d.checkout.expiry, { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "12/29" })}
                {input("cvc", d.checkout.cvc, { inputMode: "numeric", autoComplete: "cc-csc", placeholder: "123" })}
              </div>
            )}
            <p className="mt-4 rounded-xl bg-[var(--background)] p-3 text-xs text-[var(--text-muted)]">{d.checkout.demo}</p>
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-[1.5rem] bg-[var(--surface-elevated)] p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">{d.cart.summary}</h2>
          <ul className="max-h-72 space-y-3 overflow-y-auto">
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              return (
                <li key={l.key} className="flex items-center gap-3 text-sm">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--background)]">
                    <Image src={p.image} alt="" fill sizes="56px" className="object-contain p-1" />
                    <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primaryColor)] text-[10px] text-white">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t(p.name, lang)}</span>
                    <span className="text-xs text-[var(--text-muted)]">{[l.color, l.size].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span>{price(p.price * l.qty, true)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">{d.cart.subtotal}</dt>
              <dd>{price(tt.subtotal, true)}</dd>
            </div>
            {tt.discount > 0 && (
              <div className="flex justify-between text-[var(--success)]">
                <dt>{d.cart.discount}</dt>
                <dd>−{price(tt.discount, true)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">{d.cart.shipping}</dt>
              <dd>{tt.shipping ? price(tt.shipping, true) : d.cart.free}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">
              <dt>{d.cart.total}</dt>
              <dd>{price(tt.total, true)}</dd>
            </div>
          </dl>
          <Button size="lg" className="w-full" disabled={placing} data-testid="place-order">
            {placing ? d.checkout.placing : `${d.checkout.placeOrder} · ${price(tt.total, true)}`}
          </Button>
        </aside>
      </form>
    </div>
  );
}
