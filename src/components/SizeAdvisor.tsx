"use client";

import { Ruler, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type FitPref, SIZE_CHART, recommendSize } from "@/lib/sizing";
import { useProfile } from "@/lib/store";
import { useI18n } from "./providers/I18nProvider";

/** Modal: collects height/weight/fit, saves them to the profile and shows the recommendation. */
export function SizeAdvisor({ open, onClose, sizes, onPick }: { open: boolean; onClose: () => void; sizes: string[]; onPick?: (size: string) => void }) {
  const { d, f } = useI18n();
  const saved = useProfile((s) => s.measurements);
  const save = useProfile((s) => s.setMeasurements);
  const [height, setHeight] = useState(saved?.height ?? 170);
  const [weight, setWeight] = useState(saved?.weight ?? 68);
  const [fit, setFit] = useState<FitPref>(saved?.fit ?? "regular");
  const [tab, setTab] = useState<"find" | "chart">("find");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const valid = height >= 120 && height <= 230 && weight >= 30 && weight <= 250;
  const rec = saved ? recommendSize(sizes, saved) : null;
  const waist = sizes[0] === "28";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={d.size.title}>
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="fade-in relative w-full max-w-md rounded-t-3xl bg-bg p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl">
            <Ruler className="size-5 text-accent" /> {d.size.title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label={d.nav.close}>
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm">
          {(["find", "chart"] as const).map((k) => (
            <button key={k} className={`h-9 rounded-full ${tab === k ? "bg-surface font-medium shadow-sm" : "text-fg-muted"}`} onClick={() => setTab(k)}>
              {k === "find" ? d.product.findSize : d.size.chart}
            </button>
          ))}
        </div>

        {tab === "find" ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              const m = { height, weight, fit };
              save(m);
              onPick?.(recommendSize(sizes, m).size);
            }}
          >
            <p className="text-sm text-fg-muted">{d.size.text}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                {d.size.height}
                <input type="number" min={120} max={230} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input mt-1.5" />
              </label>
              <label className="text-sm">
                {d.size.weight}
                <input type="number" min={30} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="input mt-1.5" />
              </label>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm">{d.size.fit}</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["snug", "regular", "relaxed"] as const).map((k) => (
                  <button type="button" key={k} className="chip" aria-pressed={fit === k} onClick={() => setFit(k)}>
                    {d.size.fits[k]}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="btn-primary w-full" disabled={!valid}>
              {d.size.calculate}
            </button>
            {rec && (
              <div className="rounded-2xl bg-accent/10 p-4 text-center" role="status" data-testid="size-result">
                <p className="font-display text-2xl">{f(d.size.result, { size: rec.size })}</p>
                <p className="mt-1 text-xs text-fg-muted">{f(d.size.confidence, { n: rec.confidence })}</p>
              </div>
            )}
          </form>
        ) : (
          <table className="mt-5 w-full text-center text-sm">
            <thead className="text-fg-muted">
              <tr>
                <th className="py-2 font-medium">{d.product.size}</th>
                <th className="py-2 font-medium">{d.size.chest}</th>
                <th className="py-2 font-medium">{d.size.waist}</th>
                <th className="py-2 font-medium">{d.size.hips}</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.size} className="border-t border-line">
                  <td className="py-2 font-medium">{waist ? r.waist : r.size}</td>
                  <td>{r.chest}</td>
                  <td>{r.waistCm}</td>
                  <td>{r.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
