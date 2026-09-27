"use client";

import { Camera, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { drawScaled } from "@/lib/image";
import { useI18n } from "../providers/I18nProvider";

/** Selfie camera with a short countdown so there's time to step back for a full-body shot. */
export function CameraCapture({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const { d } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [error, setError] = useState(() => !navigator.mediaDevices);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const countdown = (n: number) => {
    if (n === 0) {
      setCount(null);
      const v = video.current;
      if (v && v.videoWidth) onCapture(drawScaled(v, v.videoWidth, v.videoHeight, 1600, true));
      return;
    }
    setCount(n);
    timer.current = setTimeout(() => countdown(n - 1), 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={d.fitting.camera}>
      <div className="fade-in absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-bg">
        <button className="icon-btn absolute end-3 top-3 z-10 bg-bg/80" onClick={onClose} aria-label={d.fitting.close}>
          <X className="size-5" />
        </button>
        {error ? (
          <p className="p-10 text-center text-fg-muted">{d.fitting.cameraError}</p>
        ) : (
          <>
            <div className="relative bg-black">
              <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full -scale-x-100 object-cover" />
              {count !== null && (
                <span className="absolute inset-0 flex items-center justify-center font-display text-8xl text-white drop-shadow-lg">{count}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm text-fg-muted">{d.fitting.uploadHint}</p>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => countdown(3)} disabled={count !== null} aria-label={`${d.fitting.capture} 3s`}>
                  <Timer className="size-4" /> 3s
                </button>
                <button className="btn-primary" onClick={() => countdown(0)} disabled={count !== null}>
                  <Camera className="size-4" /> {d.fitting.capture}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
