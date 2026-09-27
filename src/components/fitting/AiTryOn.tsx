"use client";

import { Download, Loader2, Wand2, X } from "lucide-react";
/* eslint-disable @next/next/no-img-element -- remote AI output URLs aren't known to next/image */
import { useEffect, useState } from "react";
import { type Slot, garmentSvg, garmentViewBox } from "@/lib/garments";
import { downloadDataUrl, svgToPng } from "@/lib/image";
import { productById } from "@/lib/products";
import type { Worn } from "@/lib/store";
import { useI18n } from "../providers/I18nProvider";

const CATEGORY: Record<Slot, string> = { top: "tops", outer: "tops", bottom: "bottoms", onepiece: "one-pieces" };

type Props = {
  /** Person photo as a data URL, or null for built-in models. */
  photo: string | null;
  garment: { slot: Slot; worn: Worn } | null;
};

export function AiTryOn({ photo, garment }: Props) {
  const { d, f } = useI18n();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/try-on")
      .then((r) => r.json())
      .then((j) => setEnabled(!!j.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const run = async () => {
    if (!photo || !garment) return;
    const p = productById(garment.worn.productId)!;
    setRunning(true);
    setError(null);
    try {
      const vb = garmentViewBox(p.kind);
      const k = 768 / Math.max(vb.w, vb.h);
      const garmentImage = await svgToPng(garmentSvg({ kind: p.kind, color: garment.worn.color, background: "#ffffff" }), Math.round(vb.w * k), Math.round(vb.h * k));
      const start = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImage: photo, garmentImage, category: CATEGORY[garment.slot] }),
      }).then((r) => r.json());
      if (!start.id) throw new Error(start.error ?? "request failed");
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await fetch(`/api/try-on?id=${encodeURIComponent(start.id)}`).then((r) => r.json());
        if (s.status === "completed" && s.output?.[0]) {
          setResult(s.output[0]);
          return;
        }
        if (s.status === "failed" || s.error) throw new Error(s.error ?? "failed");
      }
      throw new Error("timed out");
    } catch (e) {
      setError(f(d.fitting.aiError, { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setRunning(false);
    }
  };

  const hint = enabled === false ? d.fitting.aiUnavailable : !photo ? d.fitting.aiNeedsPhoto : !garment ? d.fitting.aiNeedsGarment : null;

  return (
    <div className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Wand2 className="size-4 text-accent" /> {d.fitting.aiTitle}
      </p>
      <p className="mt-1 text-sm text-fg-muted">{d.fitting.aiText}</p>
      {hint && <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-fg-muted" data-testid="ai-hint">{hint}</p>}
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      <button className="btn-outline mt-3 w-full" disabled={!enabled || !photo || !garment || running} onClick={run}>
        {running ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
        {running ? d.fitting.aiRunning : d.fitting.aiRun}
      </button>

      {result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={d.fitting.aiResult}>
          <div className="fade-in absolute inset-0 bg-black/70" onClick={() => setResult(null)} />
          <div className="relative max-h-full overflow-auto rounded-3xl bg-bg p-4">
            <div className="mb-3 flex items-center justify-between gap-6">
              <p className="font-semibold">{d.fitting.aiResult}</p>
              <div className="flex gap-1">
                <button className="icon-btn" onClick={() => downloadDataUrl(result, "vestra-ai-try-on.png")} aria-label={d.fitting.download}>
                  <Download className="size-5" />
                </button>
                <button className="icon-btn" onClick={() => setResult(null)} aria-label={d.fitting.close}>
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <img src={result} alt={d.fitting.aiResult} className="max-h-[75vh] rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
