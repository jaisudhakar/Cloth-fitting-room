"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { searchProducts, t } from "@/lib/catalog";
import { useUi } from "@/lib/store";
import { useI18n } from "../I18nProvider";

export function SearchDialog() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return <AnimatePresence>{open && <Panel onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function Panel({ onClose }: { onClose: () => void }) {
  const { d, lang, href, price } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchProducts(q).slice(0, 7), [q]);
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={d.nav.search}>
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-[var(--surface-elevated)] shadow-2xl"
      >
        <form
          className="flex items-center gap-3 border-b border-[var(--border)] px-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            onClose();
            router.push(href(`/shop?q=${encodeURIComponent(q.trim())}`));
          }}
        >
          <IconSearch size={18} stroke={1.8} className="text-[var(--text-muted)]" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchDialog.placeholder} className="h-14 flex-1 bg-transparent text-sm outline-none" aria-label={d.nav.search} />
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" aria-label={d.common.close}>
            <IconX size={16} />
          </button>
        </form>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!q.trim() ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{d.searchDialog.hint}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{d.searchDialog.noResults}</p>
          ) : (
            <>
              <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{d.searchDialog.products}</p>
              {results.map((p) => (
                <Link key={p.id} href={href(`/products/${p.slug}`)} onClick={onClose} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-hover)]">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--background)]">
                    <Image src={p.image} alt="" fill sizes="48px" className="object-contain p-1" />
                  </span>
                  <span className="flex-1 truncate text-sm">{t(p.name, lang)}</span>
                  <span className="text-sm font-semibold">{price(p.price)}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
