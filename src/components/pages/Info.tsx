"use client";

import { IconChevronDown, IconCircleCheck, IconHeart, IconMail, IconMapPin, IconPackage, IconPhone, IconTruckDelivery } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, PRODUCTS, t } from "@/lib/catalog";
import { useAccount, useHydrated, useWishlist } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { ProductCard } from "../product/ProductCard";
import { Breadcrumbs } from "../shop/PromoCarousel";
import { Button, ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";
import { EmptyState } from "./Cart";

const field =
  "h-11 w-full rounded-full border border-[var(--input-border)]/60 bg-[var(--input-bg)] px-4 text-sm outline-none transition-colors focus:border-[var(--primaryColor)]";

function Page({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8">
      <Breadcrumbs items={[{ label: crumb }]} />
      {children}
    </div>
  );
}

export function Wishlist() {
  const { d, href } = useI18n();
  const hydrated = useHydrated();
  const ids = useWishlist((s) => s.ids);
  const items = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p) => !!p);
  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!items.length) return <EmptyState icon={IconHeart} title={d.wishlist.empty} text={d.wishlist.emptyText} cta={{ href: href("/shop"), label: d.cart.continue }} />;
  return (
    <Page crumb={d.wishlist.title}>
      <h1 className="mb-8 text-2xl font-semibold md:text-[2rem]">{d.wishlist.title}</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </Page>
  );
}

export function Account() {
  const { d, f, href, price } = useI18n();
  const hydrated = useHydrated();
  const create = useSearchParams().get("create") === "1";
  const { email, orders, signIn, signOut } = useAccount();
  const [value, setValue] = useState("");
  if (!hydrated) return <div className="min-h-[50vh]" />;
  return (
    <Page crumb={d.account.title}>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Reveal className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-8">
          {email ? (
            <>
              <h1 className="text-2xl font-semibold">{d.account.title}</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{f(d.account.signedIn, { email })}</p>
              <div className="mt-6 flex gap-3">
                <ButtonLink href={href("/account/wishlist")} variant="soft">
                  {d.footer.wishlist}
                </ButtonLink>
                <Button variant="outline" onClick={signOut}>
                  {d.account.signOut}
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (value.includes("@")) signIn(value.trim());
              }}
            >
              <h1 className="text-2xl font-semibold">{create ? d.account.create : d.account.welcome}</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{d.account.text}</p>
              <label className="mt-6 block text-sm">
                <span className="mb-1.5 block text-[var(--text-muted)]">{d.account.email}</span>
                <input type="email" required value={value} onChange={(e) => setValue(e.target.value)} className={field} autoComplete="email" />
              </label>
              <label className="mt-4 block text-sm">
                <span className="mb-1.5 block text-[var(--text-muted)]">{d.account.password}</span>
                <input type="password" required minLength={6} className={field} autoComplete={create ? "new-password" : "current-password"} />
              </label>
              <Button size="lg" className="mt-6 w-full">
                {create ? d.account.create : d.account.submit}
              </Button>
            </form>
          )}
        </Reveal>
        <Reveal delay={0.1} className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-8">
          <h2 className="flex items-center gap-2 font-semibold">
            <IconPackage size={18} className="text-[var(--primaryColor)]" /> {d.account.orders}
          </h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">{d.account.noOrders}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <a href={href(`/track-order?order=${o.id}`)} className="font-medium hover:text-[var(--primaryColor)]">
                    #{o.id}
                  </a>
                  <span className="text-[var(--text-muted)]">{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold">{price(o.total, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </Page>
  );
}

export function About() {
  const { d, lang, href } = useI18n();
  return (
    <Page crumb={d.pages.aboutTitle}>
      <section className="relative overflow-hidden rounded-[2rem]">
        <Image src="/assets/images/banners/banner-outerwear.jpg" alt="" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20 rtl:bg-gradient-to-l" />
        <Reveal className="relative max-w-xl px-8 py-20 md:px-14 md:py-28">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/60 rtl:tracking-normal">{d.pages.aboutEyebrow}</p>
          <h1 className="mt-4 text-4xl font-light text-white md:text-5xl">{d.pages.aboutTitle}</h1>
          <p className="mt-4 text-lg text-white/80">{d.pages.aboutLead}</p>
        </Reveal>
      </section>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">{d.pages.aboutText}</p>
          <ButtonLink href={href("/shop")} className="mt-8">
            {d.home.shopNow}
          </ButtonLink>
        </Reveal>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.slice(0, 6).map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.06} className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--product-card-bg)]">
              <Image src={c.image} alt={t(c.name, lang)} fill sizes="200px" className="object-cover" />
            </Reveal>
          ))}
        </div>
      </div>
    </Page>
  );
}

export function Contact() {
  const { d } = useI18n();
  const [sent, setSent] = useState(false);
  return (
    <Page crumb={d.pages.contactTitle}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Reveal className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-8">
          <h1 className="text-3xl font-semibold">{d.pages.contactTitle}</h1>
          <p className="mt-3 text-[var(--text-muted)]">{d.pages.contactText}</p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              [IconMail, "contact@yourdomain.com"],
              [IconPhone, "+1 (555) 000-0000"],
              [IconMapPin, d.footer.address],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof IconMail;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primaryColor)]/10 text-[var(--accent-text)]">
                    <I size={18} stroke={1.6} />
                  </span>
                  <span dir={i === 1 ? "ltr" : undefined}>{text as string}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="rounded-[1.5rem] bg-[var(--surface-elevated)] p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <IconCircleCheck size={48} stroke={1.4} className="text-[var(--primaryColor)]" />
              <p className="text-lg">{d.pages.sent}</p>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="text-sm">
                <span className="mb-1.5 block text-[var(--text-muted)]">{d.pages.name}</span>
                <input required className={field} autoComplete="name" />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block text-[var(--text-muted)]">{d.checkout.email}</span>
                <input required type="email" className={field} autoComplete="email" />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block text-[var(--text-muted)]">{d.pages.message}</span>
                <textarea required rows={6} className="w-full rounded-3xl border border-[var(--input-border)]/60 bg-[var(--input-bg)] p-4 text-sm outline-none focus:border-[var(--primaryColor)]" />
              </label>
              <Button size="lg" className="sm:col-span-2">
                {d.pages.send}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </Page>
  );
}

export function Faq() {
  const { d } = useI18n();
  const [open, setOpen] = useState(0);
  return (
    <Page crumb={d.nav.faq}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-light md:text-4xl">{d.pages.faqTitle}</h1>
        <div className="mt-10 space-y-3">
          {d.pages.faq.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05} className="overflow-hidden rounded-[1.25rem] bg-[var(--surface-elevated)]">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-start font-medium" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {item.q}
                <IconChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180 text-[var(--primaryColor)]" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          ))}
        </div>
      </div>
    </Page>
  );
}

/** Demo progression: a new order moves one step roughly every day. */
const orderStage = (createdAt: number) => Math.min(3, Math.floor((Date.now() - createdAt) / 86_400_000) + 1);

export function TrackOrder() {
  const { d } = useI18n();
  const hydrated = useHydrated();
  const orders = useAccount((s) => s.orders);
  const initial = useSearchParams().get("order") ?? "";
  const [id, setId] = useState(initial);
  const [query, setQuery] = useState(initial);
  const order = hydrated ? orders.find((o) => o.id.toLowerCase() === query.trim().toLowerCase().replace(/^#/, "")) : undefined;
  const steps = [d.pages.status.placed, d.pages.status.processing, d.pages.status.shipped, d.pages.status.delivered];
  // Demo progression: a new order moves one step roughly every day.
  const stage = order ? orderStage(order.createdAt) : 0;
  return (
    <Page crumb={d.pages.trackTitle}>
      <div className="mx-auto max-w-2xl rounded-[1.5rem] bg-[var(--surface-elevated)] p-8">
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          <IconTruckDelivery className="text-[var(--primaryColor)]" /> {d.pages.trackTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{d.pages.trackText}</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(id);
          }}
        >
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder={d.pages.orderNumber} className={field} />
          <Button className="shrink-0">{d.pages.track}</Button>
        </form>
        {query && hydrated && !order && <p className="mt-4 text-sm text-[var(--danger)]">{d.pages.trackNotFound}</p>}
        {order && (
          <ol className="mt-8 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <li key={s} className="text-center text-xs">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className={`h-1.5 origin-left rounded-full ${i <= stage ? "bg-[var(--primaryColor)]" : "bg-[var(--surface-hover)]"}`}
                />
                <p className={`mt-2 ${i <= stage ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>{s}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Page>
  );
}
