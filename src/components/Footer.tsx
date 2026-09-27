"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/products";
import { useI18n } from "./providers/I18nProvider";

export function Footer() {
  const { d, href } = useI18n();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold">{d.brand}</p>
          <p className="mt-3 max-w-xs text-sm text-fg-muted">{d.footer.about}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{d.footer.shop}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-fg-muted">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={href(`/shop?category=${c}`)} className="hover:text-fg">
                  {d.category[c]}
                </Link>
              </li>
            ))}
            <li>
              <Link href={href("/fitting-room")} className="hover:text-fg">
                {d.nav.fittingRoom}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{d.footer.help}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-fg-muted">
            {d.footer.helpLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{d.footer.company}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-fg-muted">
            {d.footer.companyLinks.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-fg-muted">
        © {new Date().getFullYear()} {d.brand}. {d.footer.rights}
      </div>
    </footer>
  );
}
