"use client";

import { IconMinus, IconPlus, IconShoppingBag, IconTrash } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FREE_SHIPPING_AT, cartTotals, useCart, useHydrated } from "@/lib/store";
import { productById, t } from "@/lib/catalog";
import { useI18n } from "../I18nProvider";
import { Breadcrumbs } from "../shop/PromoCarousel";
import { Button, ButtonLink } from "../ui/Button";

export function EmptyState({ icon: Icon, title, text, cta }: { icon: typeof IconShoppingBag; title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[var(--text)]">
        <Icon size={26} stroke={1.5} />
      </span>
      <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-lg font-light text-[var(--text-muted)]">{text}</p>
      <ButtonLink href={cta.href} className="mt-6 h-10 px-4">
        {cta.label}
      </ButtonLink>
    </motion.div>
  );
}

export function Cart() {
  const { d, f, lang, href, price } = useI18n();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const applyPromo = useCart((s) => s.applyPromo);
  const [code, setCode] = useState("");
  const [bad, setBad] = useState(false);
  const tt = cartTotals(lines, promo);
  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!lines.length) return <EmptyState icon={IconShoppingBag} title={d.cart.empty} text={d.cart.emptyText} cta={{ href: href("/shop"), label: d.cart.continue }} />;
  const left = FREE_SHIPPING_AT - (tt.subtotal - tt.discount);
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: d.cart.title }]} />
      <h1 className="text-2xl font-semibold md:text-[2rem]">{d.cart.title}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              return (
                <motion.li
                  key={l.key}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="flex gap-4 rounded-[1.5rem] bg-[var(--surface-elevated)] p-4"
                  data-testid="cart-line"
                >
                  <Link href={href(`/products/${p.slug}`)} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[var(--background)]">
                    <Image src={p.image} alt={t(p.name, lang)} fill sizes="112px" className="object-contain p-2" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link href={href(`/products/${p.slug}`)} className="truncate font-medium hover:underline">
                        {t(p.name, lang)}
                      </Link>
                      <span className="font-semibold">{price(p.price * l.qty, true)}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{[l.color, l.size].filter(Boolean).join(" · ")}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex h-10 items-center rounded-full border border-[var(--border)]">
                        <button className="flex h-full w-10 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => setQty(l.key, l.qty - 1)} aria-label="-">
                          <IconMinus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                        <button className="flex h-full w-10 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]" onClick={() => setQty(l.key, l.qty + 1)} aria-label="+">
                          <IconPlus size={14} />
                        </button>
                      </div>
                      <button className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={() => remove(l.key)}>
                        <IconTrash size={16} /> {d.cart.remove}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <aside className="h-fit space-y-4 rounded-[1.5rem] bg-[var(--surface-elevated)] p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">{d.cart.summary}</h2>
          {left > 0 && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">{f(d.cart.freeShippingHint, { n: price(left, true) })}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                <motion.div className="h-full rounded-full bg-[var(--primaryColor)]" animate={{ width: `${Math.min(100, ((tt.subtotal - tt.discount) / FREE_SHIPPING_AT) * 100)}%` }} />
              </div>
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setBad(!applyPromo(code));
            }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={d.cart.promo} aria-invalid={bad} className="h-10 flex-1 rounded-full bg-[var(--input-bg)] px-4 text-sm outline-none aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-[var(--danger)]" />
            <Button variant="soft" className="h-10 px-4">
              {d.cart.apply}
            </Button>
          </form>
          {bad && <p className="text-xs text-[var(--danger)]">{d.cart.promoInvalid}</p>}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">{d.cart.subtotal}</dt>
              <dd>{price(tt.subtotal, true)}</dd>
            </div>
            {tt.discount > 0 && (
              <div className="flex justify-between text-[var(--success)]">
                <dt>
                  {d.cart.discount} ({promo})
                </dt>
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
          <ButtonLink href={href("/checkout")} size="lg" className="w-full">
            {d.cart.checkout}
          </ButtonLink>
          <Link href={href("/shop")} className="block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            {d.cart.continue}
          </Link>
        </aside>
      </div>
    </div>
  );
}
