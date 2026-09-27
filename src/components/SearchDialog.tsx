"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { searchProducts } from "@/lib/search";
import { t } from "@/lib/products";
import { useUi } from "@/lib/store";
import { GarmentImage } from "./GarmentImage";
import { Price } from "./Price";
import { useI18n } from "./providers/I18nProvider";

export function SearchDialog() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Mounting the panel only while open resets the query each time.
  return open ? <SearchPanel onClose={() => setOpen(false)} /> : null;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { d, lang, href } = useI18n();
  const [q, setQ] = useState("");
  const router = useRouter();
  const results = useMemo(() => (q.trim() ? searchProducts(q).slice(0, 6) : []), [q]);
  const setOpen = (v: boolean) => !v && onClose();

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={d.nav.search}>
      <div className="fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fade-in relative mx-auto mt-20 w-[min(640px,calc(100%-2rem))] overflow-hidden rounded-2xl bg-bg shadow-2xl">
        <form
          className="flex items-center gap-3 border-b border-line px-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            setOpen(false);
            router.push(href(`/shop?q=${encodeURIComponent(q.trim())}`));
          }}
        >
          <Search className="size-5 text-fg-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={d.nav.search}
            className="h-14 flex-1 bg-transparent outline-none"
            aria-label={d.nav.search}
          />
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={d.nav.close}>
            <X className="size-5" />
          </button>
        </form>
        {results.length > 0 && (
          <ul className="max-h-[60vh] overflow-y-auto p-2">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  href={href(`/product/${p.slug}`)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"
                >
                  <GarmentImage kind={p.kind} color={p.colors[0].hex} alt="" className="size-14 rounded-lg" />
                  <span className="flex-1 text-sm">{t(p.name, lang)}</span>
                  <Price price={p.price} compareAt={p.compareAt} className="text-sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
