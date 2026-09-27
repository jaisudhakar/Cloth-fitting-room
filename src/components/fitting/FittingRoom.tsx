"use client";

import {
  Camera,
  Download,
  Eye,
  Loader2,
  Radio,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AVATARS, avatarDataUrl, avatarJoints } from "@/lib/avatars";
import { type Joints, REF_H, REF_W, fallbackJoints } from "@/lib/body";
import { NO_ADJUST } from "@/lib/fit";
import { SLOT_OF, type Slot } from "@/lib/garments";
import { downloadDataUrl, drawScaled, fileToDataUrl, loadImage, svgToPng } from "@/lib/image";
import { detectImage, preloadPose, smoothJoints, videoDetector } from "@/lib/pose";
import { CATEGORIES, PRODUCTS, type Category, productBySlug, productById, t } from "@/lib/products";
import { recommendSize, sizeDelta } from "@/lib/sizing";
import { useCart, useFitting, useHydrated, useProfile, useUi } from "@/lib/store";
import { GarmentImage } from "../GarmentImage";
import { useI18n } from "../providers/I18nProvider";
import { SizeAdvisor } from "../SizeAdvisor";
import { AiTryOn } from "./AiTryOn";
import { CameraCapture } from "./CameraCapture";
import { Stage, exportSvg, stageLayers } from "./Stage";

type Source =
  | { kind: "avatar"; id: string }
  | { kind: "photo"; url: string; w: number; h: number }
  | { kind: "live"; w: number; h: number };

type PoseStatus = "idle" | "detecting" | "ok" | "fallback";

export function FittingRoom() {
  const hydrated = useHydrated();
  const { d } = useI18n();
  if (!hydrated) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-fg-muted">
        <Loader2 className="me-2 size-5 animate-spin" /> {d.common.loading}
      </div>
    );
  }
  return <Room />;
}

function Room() {
  const { d, lang, href, price } = useI18n();
  const sp = useSearchParams();
  const outfit = useFitting((s) => s.outfit);
  const wear = useFitting((s) => s.wear);
  const takeOff = useFitting((s) => s.takeOff);
  const update = useFitting((s) => s.update);
  const adjust = useFitting((s) => s.adjust);
  const clearOutfit = useFitting((s) => s.clear);
  const measurements = useProfile((s) => s.measurements);
  const addToCart = useCart((s) => s.add);
  const showToast = useUi((s) => s.showToast);
  const setCartOpen = useUi((s) => s.setCartOpen);

  const [source, setSource] = useState<Source>({ kind: "avatar", id: AVATARS[0].id });
  const [photoJoints, setPhotoJoints] = useState<Joints | null>(null);
  const [liveJoints, setLiveJoints] = useState<Joints | null>(null);
  const [status, setStatus] = useState<PoseStatus>("idle");
  const [selected, setSelected] = useState<Slot | null>(() => {
    const p = productBySlug(sp.get("product") ?? "");
    return p ? SLOT_OF[p.kind] : null;
  });
  const [comparing, setComparing] = useState(false);
  const [rack, setRack] = useState<Category | "all">("all");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [advisor, setAdvisor] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const loop = useRef<number | null>(null);

  const layers = useMemo(() => stageLayers(outfit), [outfit]);
  const avatar = source.kind === "avatar" ? AVATARS.find((a) => a.id === source.id) ?? AVATARS[0] : null;
  const joints = avatar ? avatarJoints(avatar) : source.kind === "photo" ? photoJoints : liveJoints;
  const dims = source.kind === "avatar" ? { w: REF_W, h: REF_H } : { w: source.w, h: source.h };

  // Put the product from the URL on (the "Try this on" entry point), or a starter outfit.
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    preloadPose();
    const p = productBySlug(sp.get("product") ?? "");
    const empty = Object.keys(useFitting.getState().outfit).length === 0;
    if (p) {
      // Dress the model in basics around the piece being tried, rather than leave it bare.
      const slot = SLOT_OF[p.kind];
      if (empty && (slot === "top" || slot === "outer")) wear("p10");
      if (empty && (slot === "bottom" || slot === "outer")) wear("p01");
      const color = p.colors.find((c) => c.hex === sp.get("color"))?.hex;
      const size = p.sizes.includes(sp.get("size") ?? "") ? sp.get("size")! : measurements ? recommendSize(p.sizes, measurements).size : undefined;
      wear(p.id, color, size);
    } else if (empty) {
      wear("p10");
      wear("p01");
    }
  }, [sp, wear, measurements]);

  const stopLive = useCallback(() => {
    if (loop.current) cancelAnimationFrame(loop.current);
    loop.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  }, []);
  useEffect(() => stopLive, [stopLive]);

  const loadPhoto = async (url: string) => {
    stopLive();
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setSource({ kind: "photo", url, w, h });
    setPhotoJoints(null);
    setStatus("detecting");
    try {
      const j = await detectImage(img);
      setPhotoJoints(j ?? fallbackJoints(w, h));
      setStatus(j ? "ok" : "fallback");
    } catch (e) {
      console.warn("Pose detection unavailable", e);
      setPhotoJoints(fallbackJoints(w, h));
      setStatus("fallback");
    }
  };

  const startLive = async () => {
    setCameraError(false);
    stopLive();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e) {
      console.warn("Camera unavailable", e);
      setCameraError(true);
      return;
    }
    setLiveJoints(null);
    setStatus("detecting");
    setSource({ kind: "live", w: 960, h: 720 });
  };

  // Once the live <video> has mounted, attach the stream and track the body every frame.
  const live = source.kind === "live";
  useEffect(() => {
    const v = video.current;
    const s = stream.current;
    if (!live || !v || !s) return;
    let cancelled = false;
    (async () => {
      v.srcObject = s;
      await new Promise<void>((r) => (v.readyState >= 1 ? r() : (v.onloadedmetadata = () => r())));
      await v.play().catch(() => {});
      if (cancelled) return;
      const w = v.videoWidth || 960;
      const h = v.videoHeight || 720;
      setSource({ kind: "live", w, h });
      let detect: Awaited<ReturnType<typeof videoDetector>> | null = null;
      try {
        detect = await videoDetector();
      } catch (e) {
        console.warn("Pose detection unavailable", e);
      }
      if (cancelled) return;
      if (!detect) {
        setLiveJoints(fallbackJoints(w, h));
        setStatus("fallback");
        return;
      }
      let prev: Joints | null = null;
      let misses = 0;
      const tick = (now: number) => {
        if (cancelled) return;
        if (v.readyState >= 2) {
          const next = detect!(v, now);
          prev = smoothJoints(prev, next);
          misses = next ? 0 : misses + 1;
          // After ~3s without a body, fall back to a manual position.
          if (!prev && misses > 180) prev = fallbackJoints(w, h);
          setStatus(next ? "ok" : prev && misses > 180 ? "fallback" : "detecting");
          if (prev) setLiveJoints(prev);
        }
        loop.current = requestAnimationFrame(tick);
      };
      loop.current = requestAnimationFrame(tick);
    })();
    return () => {
      cancelled = true;
      if (loop.current) cancelAnimationFrame(loop.current);
    };
  }, [live]);

  const chooseAvatar = (id: string) => {
    stopLive();
    setSource({ kind: "avatar", id });
    setStatus("idle");
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    await loadPhoto(await fileToDataUrl(file));
  };

  const putOn = (productId: string) => {
    const p = productById(productId)!;
    const size = measurements ? recommendSize(p.sizes, measurements).size : undefined;
    const current = outfit[SLOT_OF[p.kind]];
    if (current?.productId === productId) {
      setSelected(SLOT_OF[p.kind]);
      return;
    }
    wear(productId, undefined, size);
    setSelected(SLOT_OF[p.kind]);
  };

  const onMove = useCallback(
    (slot: Slot, dx: number, dy: number) => {
      const w = useFitting.getState().outfit[slot];
      if (w) adjust(slot, { dx: w.adjust.dx + dx, dy: w.adjust.dy + dy });
    },
    [adjust],
  );

  // Arrow keys nudge the selected garment.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const step = e.shiftKey ? 10 : 2;
      const k = dims.w / 400;
      const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const m = map[e.key];
      if (m) {
        e.preventDefault();
        onMove(selected, m[0] * k, m[1] * k);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        takeOff(selected);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onMove, takeOff, dims.w]);

  const save = async () => {
    if (!joints) return;
    let background: string;
    if (source.kind === "avatar") background = avatarDataUrl(avatar!);
    else if (source.kind === "photo") background = source.url;
    else {
      const v = video.current!;
      background = drawScaled(v, v.videoWidth, v.videoHeight, 4000);
    }
    const scale = source.kind === "avatar" ? 2 : 1;
    const svg = exportSvg({ width: dims.w, height: dims.h, background, layers, joints, measurements });
    downloadDataUrl(await svgToPng(svg, dims.w * scale, dims.h * scale), "vestra-fitting-room.png");
  };

  const addLook = () => {
    for (const l of layers) addToCart(l.worn.productId, l.worn.color, l.worn.size);
    showToast(d.fitting.lookAdded);
    setCartOpen(true);
  };

  const lookTotal = layers.reduce((s, l) => s + (productById(l.worn.productId)?.price ?? 0), 0);
  const sel = selected ? outfit[selected] : undefined;
  const selProduct = sel ? productById(sel.productId) : undefined;
  const rackItems = PRODUCTS.filter((p) => rack === "all" || p.category === rack);
  const aiGarment = selected && sel ? { slot: selected, worn: sel } : layers.length ? layers[layers.length - 1] : null;

  const statusText =
    status === "detecting" ? d.fitting.detecting : status === "ok" ? d.fitting.detected : status === "fallback" ? d.fitting.notDetected : null;

  return (
    <div className="container-x py-8">
      <div className="max-w-3xl">
        <p className="eyebrow text-accent">{d.nav.fittingRoom}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{d.fitting.title}</h1>
        <p className="mt-3 text-fg-muted">{d.fitting.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Stage */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative">
            <Stage
              width={dims.w}
              height={dims.h}
              background={source.kind === "avatar" ? avatarDataUrl(avatar!) : source.kind === "photo" ? source.url : undefined}
              video={source.kind === "live" ? <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" /> : undefined}
              joints={joints}
              layers={layers}
              measurements={measurements}
              selected={selected}
              onSelect={setSelected}
              onMove={onMove}
              hideGarments={comparing}
              mirrored={source.kind === "live"}
              label={d.fitting.title}
            />
            {statusText && (
              <p
                className={`absolute inset-x-3 top-3 mx-auto w-fit max-w-[90%] rounded-full px-4 py-2 text-center text-xs shadow backdrop-blur ${
                  status === "fallback" ? "bg-amber-100/95 text-amber-900" : "bg-surface/90"
                } ${status === "ok" ? "fade-out-late pointer-events-none" : ""}`}
                role="status"
                data-testid="pose-status"
              >
                {status === "detecting" && <Loader2 className="me-1.5 inline size-3.5 animate-spin" />}
                {statusText}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              className="btn-outline select-none"
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              onKeyDown={(e) => e.key === " " && setComparing(true)}
              onKeyUp={() => setComparing(false)}
            >
              <Eye className="size-4" /> {d.fitting.compare}
            </button>
            <button className="btn-outline" onClick={save} disabled={!joints}>
              <Download className="size-4" /> {d.fitting.download}
            </button>
            <button className="btn-outline" onClick={() => { clearOutfit(); setSelected(null); }} disabled={!layers.length}>
              <Trash2 className="size-4" /> {d.fitting.clear}
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-fg-muted">
            <ShieldCheck className="size-3.5" /> {d.fitting.privacy}
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <section>
            <h2 className="font-semibold">{d.fitting.step1}</h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => chooseAvatar(a.id)}
                  aria-pressed={source.kind === "avatar" && source.id === a.id}
                  className="group overflow-hidden rounded-2xl border border-line ring-offset-2 ring-offset-bg aria-pressed:ring-2 aria-pressed:ring-accent"
                  data-testid={`avatar-${a.id}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarDataUrl(a)} alt="" className="aspect-[3/4] w-full object-cover object-top" />
                  <span className="block py-1.5 text-xs">{a.name[lang]}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                className="btn-outline h-auto flex-col gap-1 rounded-2xl py-3 text-xs aria-pressed:border-accent"
                aria-pressed={source.kind === "photo"}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="size-5" /> {d.fitting.upload}
              </button>
              <button className="btn-outline h-auto flex-col gap-1 rounded-2xl py-3 text-xs" onClick={() => setCameraOpen(true)}>
                <Camera className="size-5" /> {d.fitting.camera}
              </button>
              <button
                className="btn-outline h-auto flex-col gap-1 rounded-2xl py-3 text-xs aria-pressed:border-accent aria-pressed:text-accent"
                aria-pressed={source.kind === "live"}
                onClick={() => (source.kind === "live" ? chooseAvatar(AVATARS[0].id) : startLive())}
              >
                <Radio className={`size-5 ${source.kind === "live" ? "animate-pulse" : ""}`} />
                {source.kind === "live" ? d.fitting.stopLive : d.fitting.live}
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="photo-input"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <p className="mt-2 text-xs text-fg-muted">{d.fitting.uploadHint}</p>
            {cameraError && <p className="mt-2 text-sm text-danger" role="alert">{d.fitting.cameraError}</p>}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{d.fitting.wearing}</h2>
              {measurements ? (
                <button className="text-xs text-fg-muted underline-offset-4 hover:underline" onClick={() => setAdvisor(true)}>
                  <Ruler className="me-1 inline size-3.5" />
                  {d.fitting.yourSize}: {measurements.height} cm · {measurements.weight} kg
                </button>
              ) : (
                <button className="inline-flex items-center gap-1 text-xs font-medium text-accent" onClick={() => setAdvisor(true)}>
                  <Ruler className="size-3.5" /> {d.fitting.setSize}
                </button>
              )}
            </div>
            {layers.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">{d.fitting.nothing}</p>
            ) : (
              <ul className="mt-3 space-y-2" data-testid="wearing-list">
                {[...layers].reverse().map(({ slot, worn }) => {
                  const p = productById(worn.productId)!;
                  const delta = sizeDelta(p.sizes, worn.size, measurements);
                  const rec = measurements ? recommendSize(p.sizes, measurements).size : null;
                  return (
                    <li
                      key={slot}
                      className={`flex gap-3 rounded-2xl border p-2.5 transition ${selected === slot ? "border-accent bg-accent/5" : "border-line"}`}
                      onClick={() => setSelected(slot)}
                    >
                      <GarmentImage kind={p.kind} color={worn.color} alt="" className="size-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wider text-fg-muted">{d.fitting.slot[slot]}</p>
                            <Link href={href(`/product/${p.slug}`)} className="block truncate text-sm font-medium hover:underline">
                              {t(p.name, lang)}
                            </Link>
                          </div>
                          <button
                            className="icon-btn size-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              takeOff(slot);
                              if (selected === slot) setSelected(null);
                            }}
                            aria-label={d.fitting.remove}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <div className="flex gap-1" role="radiogroup" aria-label={d.fitting.color}>
                            {p.colors.map((c) => (
                              <button
                                key={c.hex}
                                role="radio"
                                aria-checked={worn.color === c.hex}
                                aria-label={t(c.name, lang)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  update(slot, { color: c.hex });
                                }}
                                className="size-5 rounded-full border border-black/10 ring-offset-1 ring-offset-bg aria-checked:ring-2 aria-checked:ring-fg"
                                style={{ background: c.hex }}
                              />
                            ))}
                          </div>
                          <select
                            value={worn.size}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => update(slot, { size: e.target.value })}
                            className="h-7 rounded-lg border border-line bg-surface px-1.5 text-xs"
                            aria-label={d.fitting.size}
                          >
                            {p.sizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                                {s === rec ? " ✓" : ""}
                              </option>
                            ))}
                          </select>
                          <span className="ms-auto text-sm font-semibold">{price(p.price)}</span>
                        </div>
                        {measurements && (
                          <p className={`mt-1 text-xs ${delta === 0 ? "text-success" : "text-amber-600"}`}>
                            {delta < 0 ? d.size.tight : delta > 0 ? d.size.loose : d.size.perfect}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {layers.length > 0 && (
              <button className="btn-primary mt-3 h-12 w-full" onClick={addLook} data-testid="add-look">
                <ShoppingBag className="size-4" />
                {d.fitting.addLook} · {price(lookTotal)}
              </button>
            )}
          </section>

          <section>
            <h2 className="font-semibold">{d.fitting.step3}</h2>
            {!sel || !selProduct || !selected ? (
              <p className="mt-2 text-sm text-fg-muted">{d.fitting.selectLayer}</p>
            ) : (
              <div className="mt-3 space-y-3 rounded-2xl bg-muted p-4" data-testid="adjust-panel">
                <p className="text-sm font-medium">{t(selProduct.name, lang)}</p>
                {(
                  [
                    ["scale", d.fitting.scale, 0.6, 1.5, 0.01],
                    ["length", d.fitting.length, 0.7, 1.4, 0.01],
                    ["rotate", d.fitting.rotate, -25, 25, 0.5],
                    ["opacity", d.fitting.opacity, 0.3, 1, 0.01],
                  ] as const
                ).map(([key, label, min, max, step]) => (
                  <label key={key} className="grid grid-cols-[80px_1fr_44px] items-center gap-3 text-sm">
                    <span>{label}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={sel.adjust[key]}
                      onChange={(e) => adjust(selected, { [key]: Number(e.target.value) })}
                      aria-label={label}
                    />
                    <span className="text-end text-xs tabular-nums text-fg-muted">
                      {key === "rotate" ? `${sel.adjust[key]}°` : `${Math.round(sel.adjust[key] * 100)}%`}
                    </span>
                  </label>
                ))}
                <button className="btn-ghost h-9 w-full text-xs" onClick={() => adjust(selected, NO_ADJUST)}>
                  <RotateCcw className="size-3.5" /> {d.fitting.reset}
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="font-semibold">{d.fitting.step2}</h2>
            <p className="mt-1 text-xs text-fg-muted">{d.fitting.rackHint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", ...CATEGORIES] as const).map((c) => (
                <button key={c} className="chip h-8 text-xs" aria-pressed={rack === c} onClick={() => setRack(c)}>
                  {c === "all" ? d.fitting.all : d.category[c]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3" data-testid="rack">
              {rackItems.map((p) => {
                const on = outfit[SLOT_OF[p.kind]]?.productId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => putOn(p.id)}
                    aria-pressed={on}
                    title={t(p.name, lang)}
                    className="group relative overflow-hidden rounded-2xl border border-line text-start transition hover:border-fg aria-pressed:border-accent aria-pressed:ring-1 aria-pressed:ring-accent"
                  >
                    <GarmentImage kind={p.kind} color={on ? outfit[SLOT_OF[p.kind]]!.color : p.colors[0].hex} alt="" className="aspect-square w-full" />
                    <span className="block truncate px-2 pt-1.5 text-xs">{t(p.name, lang)}</span>
                    <span className="block px-2 pb-2 text-xs font-semibold">{price(p.price)}</span>
                    {on && <span className="absolute end-1.5 top-1.5 size-2.5 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </section>

          <AiTryOn photo={source.kind === "photo" ? source.url : null} garment={aiGarment} />
        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(url) => {
            setCameraOpen(false);
            loadPhoto(url);
          }}
        />
      )}
      <SizeAdvisor
        open={advisor}
        onClose={() => setAdvisor(false)}
        sizes={["XS", "S", "M", "L", "XL", "XXL"]}
        onPick={() => {
          // Re-size everything being worn to the new recommendation.
          const m = useProfile.getState().measurements;
          if (!m) return;
          for (const l of layers) {
            const p = productById(l.worn.productId)!;
            update(l.slot, { size: recommendSize(p.sizes, m).size });
          }
        }}
      />
    </div>
  );
}
