"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImage, scaleImage } from "@/lib/photo";
import type { StageItem } from "./FitStage";

type Person = { src: string; w: number; h: number } | null;

/**
 * Renders the exact look (garments actually worn, via the image model) for
 * the current outfit and person, automatically and shortly after the outfit
 * settles. Results are kept per outfit so switching back is instant.
 */
export function useLook({ items, person, apiKey }: { items: StageItem[]; person: Person; apiKey: string | null }) {
  const [serverKey, setServerKey] = useState(false);
  const [looks, setLooks] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const fresh = useRef(false);

  useEffect(() => {
    fetch("/api/fitting-room")
      .then((r) => r.json())
      .then((j: { serverKey?: boolean }) => setServerKey(!!j.serverKey))
      .catch(() => {});
  }, []);

  const canRender = serverKey || !!apiKey;
  const personId = person ? `photo:${person.w}x${person.h}:${person.src.length}:${person.src.slice(-32)}` : "model";
  const signature = `${personId}|${items.map((i) => `${i.layer}:${i.product.id}`).join(",")}`;

  // Latest values for the async render, without re-triggering it.
  const latest = useRef({ items, person, apiKey, looks, errors });
  useEffect(() => {
    latest.current = { items, person, apiKey, looks, errors };
  });

  useEffect(() => {
    const { items, looks, errors } = latest.current;
    if (!canRender || !items.length) return;
    const forced = fresh.current;
    if (!forced && (looks[signature] || errors[signature])) return;
    const ctrl = new AbortController();
    // Wait for the outfit to settle, so quick successive taps cost one render.
    const timer = setTimeout(async () => {
      fresh.current = false;
      setPending(signature);
      try {
        const { person, apiKey } = latest.current;
        const personData = person ? scaleImage(await loadImage(person.src), 1280).src : undefined;
        const res = await fetch("/api/fitting-room", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json", ...(apiKey ? { "x-goog-api-key": apiKey } : {}) },
          body: JSON.stringify({ garments: items.map((i) => i.product.slug), person: personData, fresh: forced || undefined }),
        });
        const json = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
        if (!res.ok || !json.image) throw new Error(json.error ?? `HTTP ${res.status}`);
        setLooks((l) => ({ ...l, [signature]: json.image! }));
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setErrors((er) => ({ ...er, [signature]: e instanceof Error ? e.message : String(e) }));
      } finally {
        setPending((p) => (p === signature ? null : p));
      }
    }, 1200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [signature, canRender, nonce]);

  const redraw = useCallback(() => {
    fresh.current = true;
    setErrors((er) => {
      const next = { ...er };
      delete next[signature];
      return next;
    });
    setNonce((n) => n + 1);
  }, [signature]);

  return {
    serverKey,
    canRender,
    signature,
    image: looks[signature] ?? null,
    pending: pending === signature,
    error: errors[signature] ?? null,
    redraw,
  };
}
