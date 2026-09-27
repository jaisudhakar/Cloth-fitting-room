"use client";

import { IconShoppingBag, IconTrash } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { productById, t } from "@/lib/catalog";
import { cartTotals, useCart } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { ButtonLink } from "../ui/Button";

export function BagPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, lang, href, price } = useI18n();
  const lines = useCart((s) => s.lines);
  const remove = useCart((s) => s.remove);
  const { subtotal } = cartTotals(lines);
  return (
    <div
      className={`absolute end-0 z-50 mt-2 w-80 origin-top-right rounded-2xl bg-[var(--surface-elevated)] p-2 shadow-[0_8px_24px_-8px_rgba(16,16,20,0.16),0_24px_56px_-16px_rgba(16,16,20,0.22)] transition-[opacity,transform] duration-200 dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.7),0_28px_64px_-12px_rgba(0,0,0,0.9)] ${
        open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
      data-testid="bag-popover"
    >
      <p className="px-2 pb-1 pt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{d.bag.title}</p>
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-[var(--text-muted)]">
            <IconShoppingBag size={20} stroke={1.6} />
          </span>
          <p className="text-sm font-medium text-[var(--text)]">{d.bag.empty}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{d.bag.emptyText}</p>
        </div>
      ) : (
        <>
          <ul className="max-h-72 space-y-1 overflow-y-auto p-1">
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              return (
                <li key={l.key} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-[var(--surface-hover)]">
                  <Link href={href(`/products/${p.slug}`)} onClick={onClose} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--background)]">
                    <Image src={p.image} alt={t(p.name, lang)} fill sizes="56px" className="object-contain p-1" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--text)]">{t(p.name, lang)}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {[l.color, l.size].filter(Boolean).join(" · ")} {l.qty > 1 && `× ${l.qty}`}
                    </p>
                    <p className="text-sm font-semibold">{price(p.price * l.qty)}</p>
                  </div>
                  <button className="rounded-full p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={() => remove(l.key)} aria-label="Remove">
                    <IconTrash size={16} stroke={1.6} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between px-3 py-2 text-sm">
            <span className="text-[var(--text-muted)]">{d.bag.subtotal}</span>
            <span className="font-semibold">{price(subtotal, true)}</span>
          </div>
        </>
      )}
      <div className="flex gap-2 p-1">
        <ButtonLink href={href("/cart")} variant="soft" className="h-10 flex-1 px-4">
          {d.bag.view}
        </ButtonLink>
        {lines.length > 0 && (
          <ButtonLink href={href("/checkout")} className="h-10 flex-1 px-4">
            {d.bag.checkout}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
