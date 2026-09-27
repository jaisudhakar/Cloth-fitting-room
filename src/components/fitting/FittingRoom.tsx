"use client";

import {
  IconArrowsMaximize,
  IconCamera,
  IconDownload,
  IconGripVertical,
  IconKey,
  IconLoader2,
  IconMinus,
  IconPhotoUp,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Layer, LAYERS, productById, t } from "@/lib/catalog";
import { NO_ADJUST } from "@/lib/fit";
import { loadImage, readPhoto, renderComposite } from "@/lib/photo";
import { detectPose, fallbackJoints, preloadPose } from "@/lib/pose";
import { useFitting, useHydrated, useTryOn } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { FitStage, MODEL_BASE, MODEL_IMAGE, MODEL_JOINTS, type StageItem } from "./FitStage";
import { useLook } from "./useLook";

const PANEL_W = 312;
const PANEL_H = 540;

export function FittingRoom() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <Room />;
}

/** Handles picking a photo, detecting the pose and storing the fitted result. */
function usePhotoUpload() {
  const { d } = useI18n();
  const setPhoto = useTryOn((s) => s.setPhoto);
  const setDetecting = useTryOn((s) => s.setDetecting);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(d.fitting.photoError);
      return;
    }
    setDetecting(true);
    try {
      const photo = await readPhoto(file);
      let joints = null;
      try {
        joints = await detectPose(await loadImage(photo.src));
      } catch (e) {
        console.warn("Pose detection unavailable", e);
      }
      setPhoto({ ...photo, joints: joints ?? fallbackJoints(photo.w, photo.h), fit: joints ? "detected" : "estimated" });
    } catch {
      setError(d.fitting.photoError);
    } finally {
      setDetecting(false);
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      className="hidden"
      data-testid="photo-input"
      onChange={(e) => {
        onFile(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );
  return { open: () => input.current?.click(), picker, error };
}

function Room() {
  const { d, f, lang } = useI18n();
  const open = useFitting((s) => s.open);
  const setOpen = useFitting((s) => s.setOpen);
  const equippedIds = useFitting((s) => s.equipped);
  const unequip = useFitting((s) => s.unequip);
  const reset = useFitting((s) => s.reset);
  const apiKey = useFitting((s) => s.apiKey);
  const source = useTryOn((s) => s.source);
  const photo = useTryOn((s) => s.photo);
  const detecting = useTryOn((s) => s.detecting);
  const setSource = useTryOn((s) => s.setSource);
  const adjustAll = useTryOn((s) => s.adjust);
  const drag = useDragControls();
  const upload = usePhotoUpload();
  const [keyOpen, setKeyOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [bounds, setBounds] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  useEffect(() => {
    if (open) preloadPose();
  }, [open]);

  const items = useMemo<StageItem[]>(
    () =>
      LAYERS.flatMap((layer) => {
        const id = equippedIds[layer];
        const product = id !== undefined ? productById(id) : undefined;
        return product ? [{ layer, product }] : [];
      }),
    [equippedIds],
  );
  const onPhoto = source === "photo";
  const base = onPhoto && photo ? photo : MODEL_BASE;
  const joints = onPhoto && photo ? photo.joints : MODEL_JOINTS;
  const adjust = adjustAll[onPhoto ? "photo" : "model"];
  // The exact look renders by itself for whatever is on the mannequin or the customer.
  const look = useLook({ items: onPhoto && !photo ? [] : items, person: onPhoto && photo ? photo : null, apiKey });
  const [view, setView] = useState<"exact" | "preview">("exact");
  const exact = view === "exact" ? look.image : null;

  // Keep the draggable panel on screen.
  const measure = useCallback(() => {
    const m = window.innerWidth >= 640 ? 20 : 16;
    const rtl = document.documentElement.dir === "rtl";
    const free = Math.max(0, window.innerWidth - PANEL_W - m * 2);
    setBounds({ top: -Math.max(0, window.innerHeight - PANEL_H - m * 2), bottom: 0, left: rtl ? -free : 0, right: rtl ? 0 : free });
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !keyOpen && !full && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, keyOpen, full, setOpen]);

  const count = items.length;
  const status = onPhoto && (detecting ? { text: d.fitting.detecting, tone: "busy" } : photo ? (photo.fit === "detected" ? { text: d.fitting.detected, tone: "ok" } : { text: d.fitting.estimated, tone: "warn" }) : null);

  return (
    <>
      {upload.picker}
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
                {onPhoto && photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.src} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <Image src={MODEL_IMAGE} alt="" fill sizes="44px" className="object-cover object-top" />
                )}
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
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 hidden bg-black/40 md:block" onClick={() => setOpen(false)} />
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
              <header className="flex shrink-0 items-start gap-2 px-5 pb-2 pt-4" onPointerDown={(e) => drag.start(e)} style={{ touchAction: "none" }}>
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

              <SourceSwitch source={source} onChange={setSource} className="mx-5 mb-3" />

              <div className="relative min-h-0 flex-1 px-5 [container-type:size]">
                {onPhoto && !photo ? (
                  <UploadPrompt busy={detecting} error={upload.error} onPick={upload.open} />
                ) : exact ? (
                  <motion.div
                    key={exact.length}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mx-auto overflow-hidden rounded-2xl bg-[#8e9092]"
                    style={{ width: `min(100cqw, calc(100cqh * ${base.w / base.h}))`, aspectRatio: `${base.w} / ${base.h}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URI from the image model */}
                    <img src={exact} alt={d.fitting.rendered} className="h-full w-full object-cover" data-testid="rendered-look" />
                    <span className="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-[var(--primaryColor)] px-2 py-0.5 text-[10px] font-medium text-white">
                      <IconSparkles size={11} /> {d.fitting.exactLook}
                    </span>
                    <div className="absolute bottom-2.5 end-2.5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setView("preview")}
                        className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-black/75"
                        data-testid="show-preview"
                      >
                        {d.fitting.preview}
                      </button>
                      <button type="button" onClick={() => setFull(true)} aria-label={d.fitting.fullView} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75">
                        <IconArrowsMaximize size={12} stroke={1.8} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative mx-auto" style={{ width: `min(100cqw, calc(100cqh * ${base.w / base.h}))` }}>
                    <FitStage base={base} joints={joints} items={items} adjust={adjust} />
                    {status && <StatusChip {...status} />}
                    <div className="absolute bottom-2.5 end-2.5 z-[60] flex gap-1.5">
                      {look.image && (
                        <button
                          type="button"
                          onClick={() => setView("exact")}
                          className="flex h-7 items-center gap-1 rounded-full bg-[var(--primaryColor)] px-2.5 text-[10px] font-medium text-white hover:bg-[var(--primaryColorHover)]"
                          data-testid="show-exact"
                        >
                          <IconSparkles size={12} /> {d.fitting.exactLook}
                        </button>
                      )}
                      {onPhoto && (
                        <button type="button" onClick={upload.open} aria-label={d.fitting.changePhoto} title={d.fitting.changePhoto} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75">
                          <IconCamera size={15} stroke={1.8} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFull(true)}
                        aria-label={d.fitting.fullView}
                        title={d.fitting.fullView}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"
                        data-testid="full-view"
                      >
                        <IconArrowsMaximize size={14} stroke={1.8} />
                      </button>
                    </div>
                  </div>
                )}
                <AnimatePresence>
                  {look.pending && (
                    // Non-blocking: the instant preview stays visible while the exact look renders.
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="pointer-events-none absolute inset-x-5 bottom-12 z-[70] flex justify-center"
                      data-testid="rendering"
                    >
                      <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur">
                        <IconSparkles size={12} className="animate-pulse text-[var(--primaryColor)]" /> {d.fitting.rendering}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {count > 0 && (
                <ul className="flex max-h-[4.25rem] shrink-0 flex-wrap gap-1.5 overflow-y-auto px-5 pt-3" data-testid="fitting-picks">
                  <AnimatePresence initial={false}>
                    {items.map(({ layer, product }) => (
                      <motion.li
                        key={layer}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex max-w-full items-center gap-1.5 rounded-full bg-[var(--background)] py-1 pe-1.5 ps-1"
                      >
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[var(--surface)]">
                          <Image src={product.image} alt="" fill sizes="24px" className="object-contain" />
                        </span>
                        <span className="max-w-[7.5rem] truncate text-[11px] text-[var(--text)]">{t(product.name, lang)}</span>
                        <button type="button" onClick={() => unequip(layer)} aria-label={d.fitting.close} className="rounded-full p-0.5 text-[var(--text-muted)] hover:text-[var(--text)]">
                          <IconX size={12} stroke={2} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {(look.error || upload.error) && <p className="shrink-0 px-5 pt-2 text-[11px] leading-relaxed text-[var(--danger)]">{look.error ?? upload.error}</p>}

              <footer className="flex shrink-0 items-center justify-between gap-2 px-5 pb-5 pt-3">
                <DrawButton
                  canRender={look.canRender}
                  showKey={!look.serverKey}
                  count={count}
                  pending={look.pending}
                  hasImage={!!look.image}
                  onDraw={() => {
                    setView("exact");
                    look.redraw();
                  }}
                  onKey={() => setKeyOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    useTryOn.getState().resetAdjust();
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

      <AnimatePresence>{full && <FullView items={items} drawnImage={exact} onClose={() => setFull(false)} onUpload={upload.open} />}</AnimatePresence>
      <ApiKeyDialog open={keyOpen} onClose={() => setKeyOpen(false)} />
    </>
  );
}

function SourceSwitch({ source, onChange, className = "" }: { source: "model" | "photo"; onChange: (s: "model" | "photo") => void; className?: string }) {
  const { d } = useI18n();
  return (
    <div className={`relative grid shrink-0 grid-cols-2 rounded-full bg-[var(--background)] p-1 text-xs ${className}`} role="tablist">
      {(["model", "photo"] as const).map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={source === k}
          onClick={() => onChange(k)}
          className={`relative z-[1] h-7 rounded-full font-medium transition-colors ${source === k ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}
          data-testid={`source-${k}`}
        >
          {source === k && <motion.span layoutId="tryon-source" className="absolute inset-0 -z-[1] rounded-full bg-[var(--surface-elevated)] shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          {k === "model" ? d.fitting.model : d.fitting.yourPhoto}
        </button>
      ))}
    </div>
  );
}

function UploadPrompt({ busy, error, onPick }: { busy: boolean; error: string | null; onPick: () => void }) {
  const { d } = useI18n();
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy}
      className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] px-6 text-center transition-colors hover:border-[var(--primaryColor)] disabled:cursor-wait"
      data-testid="upload-prompt"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primaryColor)]/10 text-[var(--accent-text)]">
        {busy ? <IconLoader2 size={24} className="animate-spin" /> : <IconPhotoUp size={24} stroke={1.6} />}
      </span>
      <span className="text-sm font-semibold text-[var(--text)]">{busy ? d.fitting.detecting : d.fitting.upload}</span>
      <span className="text-xs text-[var(--text-muted)]">{d.fitting.uploadHint}</span>
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      <span className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
        <IconShieldCheck size={12} /> {d.fitting.privacy}
      </span>
    </button>
  );
}

function StatusChip({ text, tone }: { text: string; tone: string }) {
  return (
    <motion.span
      key={text}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute inset-x-2 top-2 z-[60] mx-auto flex w-fit max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur ${
        tone === "warn" ? "bg-amber-100/95 text-amber-900" : "bg-black/55 text-white"
      }`}
      data-testid="fit-status"
    >
      {tone === "busy" && <IconLoader2 size={11} className="animate-spin" />}
      {tone === "ok" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      <span className="truncate">{text}</span>
    </motion.span>
  );
}

function DrawButton({
  canRender,
  showKey,
  count,
  pending,
  hasImage,
  onDraw,
  onKey,
}: {
  canRender: boolean;
  showKey: boolean;
  count: number;
  pending: boolean;
  hasImage: boolean;
  onDraw: () => void;
  onKey: () => void;
}) {
  const { d } = useI18n();
  if (!canRender)
    return (
      <button
        type="button"
        onClick={onKey}
        title={d.fitting.keyHint}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--primaryColor)] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[var(--primaryColorHover)]"
        data-testid="add-api-key"
      >
        <IconKey size={14} stroke={1.8} />
        {d.fitting.addKey}
      </button>
    );
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={onDraw}
        disabled={count === 0 || pending}
        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primaryColor)] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[var(--primaryColorHover)] disabled:pointer-events-none disabled:opacity-40"
        data-testid="draw-look"
      >
        <IconSparkles size={14} stroke={1.8} />
        <span className="truncate">{pending ? d.fitting.rendering : hasImage ? d.fitting.redraw : d.fitting.draw}</span>
      </button>
      {showKey && (
        <button type="button" onClick={onKey} aria-label={d.fitting.changeKey} title={d.fitting.changeKey} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--accent-text)] hover:bg-[var(--surface-hover)]">
          <IconKey size={15} stroke={1.8} />
        </button>
      )}
    </div>
  );
}

/** Large, editable view: select a piece to drag or resize it, save the result as an image. */
function FullView({ items, drawnImage, onClose, onUpload }: { items: StageItem[]; drawnImage: string | null; onClose: () => void; onUpload: () => void }) {
  const { d, lang } = useI18n();
  const source = useTryOn((s) => s.source);
  const photo = useTryOn((s) => s.photo);
  const adjust = useTryOn((s) => s.adjust[s.source]);
  const nudge = useTryOn((s) => s.nudge);
  const resetAdjust = useTryOn((s) => s.resetAdjust);
  const setPhoto = useTryOn((s) => s.setPhoto);
  const [selected, setSelected] = useState<Layer | null>(items[items.length - 1]?.layer ?? null);
  const [saving, setSaving] = useState(false);
  const onPhoto = source === "photo" && !!photo;
  const base = onPhoto ? photo! : MODEL_BASE;
  const joints = onPhoto ? photo!.joints : MODEL_JOINTS;
  const sel = items.find((i) => i.layer === selected);
  const scale = (adjust[selected ?? "top"] ?? NO_ADJUST).scale;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      const url = drawnImage ?? (await renderComposite(base, joints, items, adjust));
      const a = document.createElement("a");
      a.href = url;
      a.download = "store-fitting-room.png";
      a.click();
    } finally {
      setSaving(false);
    }
  };

  const tool = "flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label={d.fitting.fullView}>
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex max-h-full w-full max-w-5xl flex-col gap-3 rounded-3xl bg-[var(--surface-elevated)] p-3 sm:p-4 md:flex-row"
        onClick={(e) => e.stopPropagation()}
        data-testid="full-view-dialog"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]" style={{ height: "min(82vh, 900px)" }}>
          {drawnImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={drawnImage} alt={d.fitting.rendered} className="h-full rounded-2xl object-contain" />
          ) : (
            <div style={{ width: `min(100cqw, calc(100cqh * ${base.w / base.h}))` }}>
              <FitStage base={base} joints={joints} items={items} adjust={adjust} editable selected={selected} onSelect={setSelected} onNudge={nudge} />
            </div>
          )}
        </div>
        <aside className="flex shrink-0 flex-col gap-4 md:w-60">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">{d.fitting.title}</h2>
            <button type="button" onClick={onClose} aria-label={d.fitting.close} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]">
              <IconX size={18} />
            </button>
          </div>
          {!drawnImage && (
            <>
              <p className="text-xs text-[var(--text-muted)]">{d.fitting.adjustHint}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(({ layer, product }) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => setSelected(layer)}
                    aria-pressed={selected === layer}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--border)] py-1 pe-2.5 ps-1 text-[11px] transition-colors aria-pressed:border-[var(--primaryColor)] aria-pressed:bg-[var(--primaryColor)]/10"
                  >
                    <span className="relative h-6 w-6 overflow-hidden rounded-full bg-[var(--background)]">
                      <Image src={product.image} alt="" fill sizes="24px" className="object-contain" />
                    </span>
                    <span className="max-w-[8rem] truncate">{t(product.name, lang)}</span>
                  </button>
                ))}
              </div>
              {sel ? (
                <div className="flex items-center gap-2" data-testid="resize-controls">
                  <button type="button" className={`${tool} bg-[var(--background)] hover:bg-[var(--surface-hover)]`} onClick={() => nudge(sel.layer, { scale: Math.max(0.5, scale - 0.05) })} aria-label={d.fitting.smaller}>
                    <IconMinus size={14} />
                  </button>
                  <span className="w-12 text-center text-xs tabular-nums text-[var(--text-muted)]">{Math.round(scale * 100)}%</span>
                  <button type="button" className={`${tool} bg-[var(--background)] hover:bg-[var(--surface-hover)]`} onClick={() => nudge(sel.layer, { scale: Math.min(1.8, scale + 0.05) })} aria-label={d.fitting.larger}>
                    <IconPlus size={14} />
                  </button>
                  <button type="button" className={`${tool} text-[var(--accent-text)] hover:bg-[var(--surface-hover)]`} onClick={() => resetAdjust(sel.layer)}>
                    <IconRefresh size={14} /> {d.fitting.resetFit}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">{d.fitting.selectPiece}</p>
              )}
            </>
          )}
          <div className="mt-auto flex flex-col gap-2">
            {source === "photo" && (
              <div className="flex gap-2">
                <button type="button" onClick={onUpload} className={`${tool} flex-1 bg-[var(--background)] hover:bg-[var(--surface-hover)]`}>
                  <IconCamera size={14} /> {d.fitting.changePhoto}
                </button>
                {photo && (
                  <button type="button" onClick={() => setPhoto(null)} aria-label={d.fitting.removePhoto} title={d.fitting.removePhoto} className={`${tool} bg-[var(--background)] text-[var(--danger)] hover:bg-[var(--surface-hover)]`}>
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            )}
            <button type="button" onClick={save} disabled={saving || (!items.length && !drawnImage)} className={`${tool} h-10 bg-[var(--primaryColor)] text-white hover:bg-[var(--primaryColorHover)]`} data-testid="save-image">
              {saving ? <IconLoader2 size={15} className="animate-spin" /> : <IconDownload size={15} />} {d.fitting.save}
            </button>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}
