"use client";

import {
  IconArrowRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBuildingBank,
  IconCash,
  IconCreditCard,
  IconDeviceMobile,
  IconWallet,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "../I18nProvider";
import { LangSelect } from "./Header";

export function Footer() {
  const { d, href } = useI18n();
  const [subscribed, setSubscribed] = useState(false);
  const cols = [
    { title: d.footer.company, links: [[d.footer.aboutUs, "/about"], [d.footer.contactUs, "/contact"]] },
    { title: d.footer.support, links: [[d.nav.faq, "/faq"], [d.nav.trackOrder, "/track-order"]] },
    {
      title: d.footer.shop,
      links: [[d.nav.newArrivals, "/shop?sort=newest"], [d.nav.bestSellers, "/shop?sort=popular"], [d.nav.sale, "/shop?sale=true"], [d.nav.allProducts, "/shop"]],
    },
    { title: d.footer.quickLinks, links: [[d.nav.categories, "/categories"], [d.footer.wishlist, "/account/wishlist"], [d.nav.cart, "/cart"], [d.footer.myAccount, "/account"]] },
  ];
  const socials = [
    { label: "Instagram", icon: IconBrandInstagram },
    { label: "X", icon: IconBrandX },
    { label: "Facebook", icon: IconBrandFacebook },
    { label: "LinkedIn", icon: IconBrandLinkedin },
  ];
  const payIcons = [IconCreditCard, IconWallet, IconBuildingBank, IconDeviceMobile, IconCash];

  return (
    <footer className="mx-auto w-full max-w-[1390px] rounded-t-2xl bg-[var(--surface-elevated)]">
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-2">
          <div>
            <Link href={href("/")} className="text-2xl font-bold uppercase tracking-[0.3em] text-[var(--text)]">
              {d.brand}
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">{d.footer.about}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="text-sm text-[var(--text)]">{d.footer.follow}</span>
              <ul className="flex items-center gap-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href="#"
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--background)] text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--surface)]"
                    >
                      <s.icon size={18} stroke={1.6} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="w-full lg:max-w-md lg:justify-self-end">
            <h3 className="text-2xl font-semibold text-[var(--text)]">{d.footer.newsletter}</h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{d.footer.newsletterText}</p>
            <form
              className="mt-6 md:mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                {d.footer.email}
              </label>
              <div className="relative">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder={d.footer.email}
                  className="h-12 w-full rounded-full border border-[var(--input-border)]/30 bg-[var(--input-bg)] pe-14 ps-5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primaryColor)] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label={d.footer.newsletter}
                  className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primaryColor)] text-white transition-colors hover:bg-[var(--primaryColorHover)]"
                >
                  <IconArrowRight size={18} stroke={1.8} className="rtl:-scale-x-100" />
                </button>
              </div>
              {subscribed && <p className="mt-3 text-sm text-[var(--success)]">{d.footer.subscribed}</p>}
            </form>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 border-t border-[var(--border)] py-14 md:grid-cols-3 lg:grid-cols-5">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="mb-5 text-sm font-semibold text-[var(--text)]">{c.title}</h3>
              <ul className="space-y-3">
                {c.links.map(([label, path]) => (
                  <li key={path}>
                    <Link href={href(path)} className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-5 text-sm font-semibold text-[var(--text)]">{d.footer.contact}</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li>
                <a href="mailto:contact@yourdomain.com" className="transition-colors hover:text-[var(--text)]">
                  contact@yourdomain.com
                </a>
              </li>
              <li>
                <a href="tel:+15550000000" className="transition-colors hover:text-[var(--text)]" dir="ltr">
                  +1 (555) 000-0000
                </a>
              </li>
              <li className="leading-relaxed">{d.footer.address}</li>
              <li>{d.footer.hours}</li>
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-10 border-t border-[var(--border)] py-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">{d.footer.payment}</h3>
            <ul className="flex flex-wrap items-center gap-2">
              {payIcons.map((Icon, i) => (
                <li key={i}>
                  <span
                    aria-label={d.footer.payments[i]}
                    title={d.footer.payments[i]}
                    className="flex items-center justify-center rounded-md bg-[var(--background)] px-3 py-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                  >
                    <Icon size={18} stroke={1.5} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:justify-self-end">
            <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">{d.footer.region}</h3>
            <LangSelect up wide />
          </div>
        </div>
        <div className="border-t border-[var(--border)] py-8">
          <p className="text-center text-xs text-[var(--text-muted)]">{d.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
