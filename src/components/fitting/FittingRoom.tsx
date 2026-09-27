"use client";

import { IconGripVertical, IconKey, IconRefresh, IconSparkles, IconX, IconZoomIn } from "@tabler/icons-react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LAYERS, productById, t } from "@/lib/catalog";
import { useFitting, useHydrated } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { MODEL_IMAGE, ModelCanvas } from "./ModelCanvas";

const PANEL_W = 312;
const PANEL_H = 514;

type Look = { image: string | null; pending: boolean; error: string | null; signature: string };

export function FittingRoom() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <Room />;
}

function Room() {
  const { d, f, lang } = useI18n();
  const open = useFitting((s) => s.open);
  const setOpen = useFitting((s) => s.setOpen);
  const equippedIds = useFitting((s) => s.equipped);
  const unequip = useFitting((s) => s.unequip);
  const reset = useFitting((s) => s.reset);
  const apiKey = useFitting((s) => s.apiKey);
  const drag = useDragControls();
  const [keyOpen, setKeyOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [bounds, setBounds] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  const equipped = useMemo(
    () =>
      LAYERS.flatMap((layer) => {
        const id = equippedIds[layer];
        const product = id !== undefined ? productById(id) : undefined;
        return product ? [{ layer, product }] : [];
      }),
    [equippedIds],
  );
  const signature = equipped.map((e) => `${e.layer}:${e.product.id}`).join("|");
  const [look, setLook] = useState<Look>({ image: null, pending: false, error: null, signature: "" });
  // A drawn look belongs to one exact outfit; changing the picks returns to the preview.
  const drawn = look.signature === signature ? look : { image: null, pending: false, error: null, signature };

  // Keep the draggable panel on screen.
  const measure = useCallback(() => {
    const m = window.innerWidth >= 640 ? 20 : 16;
    const dir = document.documentElement.dir === "rtl" ? -1 : 1;
    const free = Math.max(0, window.innerWidth - PANEL_W - m * 2);
    setBounds({
      top: -Math.max(0, window.innerHeight - PANEL_H - m * 2),
      bottom: 0,
      left: dir === 1 ? 0 : -free,
      right: dir === 1 ? free : 0,
    });
  }, []);
  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !keyOpen && !zoom && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, keyOpen, zoom, setOpen]);

  const draw = async () => {
    if (!apiKey || !equipped.length) return;
    setLook({ image: null, pending: true, error: null, signature });
    try {
      const res = await fetch("/api/fitting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ lang, garments: equipped.map((e) => e.product.slug) }),
      });
      const json = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
      if (!res.ok || !json.image) throw new Error(json.error ?? `HTTP ${res.status}`);
      setLook({ image: json.image, pending: false, error: null, signature });
    } catch (e) {
      setLook({ image: null, pending: false, error: e instanceof Error ? e.message : String(e), signature });
    }
  };

  const count = equipped.length;

  return (
    <>
      {/* Trigger pill */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-4 start-4 z-[90] print:hidden sm:bottom-5 sm:start-5 max-md:[body.nav-menu-open_&]:hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[var(--surface-elevated)] py-1.5 pe-4 ps-1.5 shadow-[0_2px_6px_rgba(16,16,20,0.06),0_12px_32px_-10px_rgba(16,16,20,0.28)] transition-colors hover:bg-[var(--surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)] sm:gap-3 sm:py-2 sm:pe-5 sm:ps-2"
              data-testid="try-it-on"
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--background)] sm:h-11 sm:w-11">
                <Image src={MODEL_IMAGE} alt="" fill sizes="44px" className="object-cover object-top" />
              </span>
              <span className="text-xs font-medium text-[var(--text)] sm:text-sm">{d.fitting.trigger}</span>
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primaryColor)] px-1.5 text-[11px] font-semibold text-white">
                  {count}
                </motion.span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 hidden bg-black/40 md:block"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="panel"
              role="dialog"
              aria-label={d.fitting.title}
              drag
              dragListener={false}
              dragControls={drag}
              dragConstraints={bounds}
              dragElastic={0.04}
              dragMomentum={false}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
              style={{ width: PANEL_W, height: PANEL_H, maxHeight: "calc(100dvh - 2rem)" }}
              className="fixed bottom-4 start-4 z-[90] flex flex-col overflow-hidden rounded-3xl bg-[var(--surface-elevated)] shadow-[0_2px_6px_rgba(16,16,20,0.06),0_24px_56px_-16px_rgba(16,16,20,0.28)] print:hidden sm:bottom-5 sm:start-5 dark:shadow-[0_6px_16px_rgba(0,0,0,0.6),0_32px_72px_-16px_rgba(0,0,0,0.92)]"
              data-testid="fitting-panel"
            >
              <header className="flex shrink-0 items-start gap-2 px-5 pb-3 pt-4" onPointerDown={(e) => drag.start(e)} style={{ touchAction: "none" }}>
                <IconGripVertical size={16} className="mt-0.5 shrink-0 cursor-grab text-[var(--text-muted)] active:cursor-grabbing" aria-hidden />
                <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing">
                  <h2 className="truncate text-base font-semibold text-[var(--text)]">{d.fitting.title}</h2>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                    {count === 0 ? d.fitting.empty : `${d.fitting.picks} · ${count === 1 ? d.fitting.piece : f(d.fitting.pieces, { n: count })}`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={d.fitting.close}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                >
                  <IconX size={16} stroke={2} />
                </button>
              </header>

              <div className="relative flex min-h-0 flex-1 items-center justify-center px-5">
                <div className="relative aspect-[597/800] max-h-full w-full max-w-full">
                  {drawn.image ? (
                    <div className="relative h-full w-full overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URI from the image model */}
                      <img src={drawn.image} alt={d.fitting.rendered} className="h-full w-full object-cover" data-testid="rendered-look" />
                      <span className="absolute start-2 top-2 rounded-full bg-[var(--primaryColor)] px-2 py-0.5 text-[10px] font-medium text-white">{d.fitting.rendered}</span>
                      <button
                        type="button"
                        onClick={() => setLook((l) => ({ ...l, image: null }))}
                        className="absolute bottom-2 start-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-black/75 rtl:translate-x-1/2"
                      >
                        {d.fitting.backToPreview}
                      </button>
                    </div>
                  ) : (
                    <ModelCanvas equipped={equipped} className="h-full w-full" />
                  )}
                  <button
                    type="button"
                    onClick={() => setZoom(true)}
                    aria-label={d.fitting.zoom}
                    className="absolute bottom-2.5 end-2.5 z-[60] flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
                  >
                    <IconZoomIn size={15} stroke={1.8} />
                  </button>
                  <AnimatePresence>
                    {drawn.pending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--surface-elevated)]/85 backdrop-blur-sm"
                      >
                        <IconSparkles size={22} stroke={1.8} className="animate-pulse text-[var(--primaryColor)]" />
                        <p className="px-6 text-center text-[11px] font-medium text-[var(--text)]">{d.fitting.drawing}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {count > 0 && (
                <ul className="flex max-h-[5.5rem] shrink-0 flex-wrap gap-1.5 overflow-y-auto px-5 pt-3" data-testid="fitting-picks">
                  <AnimatePresence initial={false}>
                    {equipped.map(({ layer, product }) => (
                      <motion.li
                        key={layer}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex max-w-full items-center gap-1.5 rounded-full bg-[var(--background)] py-1 pe-1.5 ps-1"
                      >
                        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--surface)]">
                          <Image src={product.image} alt="" fill sizes="28px" className="object-contain" />
                        </span>
                        <span className="max-w-[9rem] truncate text-[11px] text-[var(--text)]">{t(product.name, lang)}</span>
                        <button type="button" onClick={() => unequip(layer)} aria-label={d.fitting.close} className="rounded-full p-0.5 text-[var(--text-muted)] hover:text-[var(--text)]">
                          <IconX size={12} stroke={2} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {drawn.error && <p className="shrink-0 px-5 pt-2 text-[11px] leading-relaxed text-[var(--danger)]">{drawn.error}</p>}

              <footer className="flex shrink-0 items-center justify-between gap-2 px-5 pb-5 pt-3">
                {apiKey ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <button
                      type="button"
                      onClick={draw}
                      disabled={count === 0 || drawn.pending}
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primaryColor)] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[var(--primaryColorHover)] disabled:pointer-events-none disabled:opacity-40"
                      data-testid="draw-look"
                    >
                      <IconSparkles size={14} stroke={1.8} />
                      <span className="truncate">{drawn.pending ? d.fitting.drawing : drawn.image ? d.fitting.redraw : d.fitting.draw}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyOpen(true)}
                      aria-label={d.fitting.changeKey}
                      title={d.fitting.changeKey}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--accent-text)] hover:bg-[var(--surface-hover)]"
                    >
                      <IconKey size={15} stroke={1.8} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setKeyOpen(true)}
                    title={d.fitting.keyHint}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--primaryColor)] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[var(--primaryColorHover)]"
                    data-testid="add-api-key"
                  >
                    <IconKey size={14} stroke={1.8} />
                    {d.fitting.addKey}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setLook({ image: null, pending: false, error: null, signature: "" });
                  }}
                  disabled={count === 0}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-[12px] font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--surface-hover)] disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconRefresh size={14} stroke={1.8} />
                  {d.fitting.startOver}
                </button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoomed view */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative h-[min(86vh,760px)]" onClick={(e) => e.stopPropagation()}>
              {drawn.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={drawn.image} alt={d.fitting.rendered} className="h-full rounded-3xl object-contain" />
              ) : (
                <ModelCanvas equipped={equipped} className="h-full w-auto rounded-3xl" />
              )}
              <button
                type="button"
                onClick={() => setZoom(false)}
                aria-label={d.fitting.close}
                className="absolute end-3 top-3 z-[80] flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
              >
                <IconX size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ApiKeyDialog open={keyOpen} onClose={() => setKeyOpen(false)} />
    </>
  );
}
