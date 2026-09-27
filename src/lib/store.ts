"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Layer, layerOf, productById } from "./catalog";

export const FREE_SHIPPING_AT = 150;
export const SHIPPING_COST = 12;
export const PROMOS: Record<string, number> = { WELCOME10: 0.1 };

export type CartLine = { key: string; productId: number; color?: string; size?: string; qty: number };

type CartState = {
  lines: CartLine[];
  promo: string | null;
  add: (productId: number, opts?: { color?: string; size?: string; qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyPromo: (code: string) => boolean;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promo: null,
      add: (productId, { color, size, qty = 1 } = {}) =>
        set((s) => {
          const key = [productId, color ?? "", size ?? ""].join("|");
          const hit = s.lines.find((l) => l.key === key);
          return hit
            ? { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l)) }
            : { lines: [...s.lines, { key, productId, color, size, qty }] };
        }),
      setQty: (key, qty) => set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [], promo: null }),
      applyPromo: (code) => {
        const c = code.trim().toUpperCase();
        if (!(c in PROMOS)) return false;
        set({ promo: c });
        return true;
      },
    }),
    { name: "store-cart" },
  ),
);

export function cartTotals(lines: CartLine[], promo: string | null = null) {
  const subtotal = lines.reduce((sum, l) => sum + (productById(l.productId)?.price ?? 0) * l.qty, 0);
  const discount = promo ? Math.round(subtotal * (PROMOS[promo] ?? 0) * 100) / 100 : 0;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const shipping = count === 0 || subtotal - discount >= FREE_SHIPPING_AT ? 0 : SHIPPING_COST;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, count };
}

type WishlistState = { ids: number[]; toggle: (id: number) => void };

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
    }),
    { name: "store-wishlist" },
  ),
);

export type Order = {
  id: string;
  email: string;
  lines: CartLine[];
  total: number;
  createdAt: number;
};

type AccountState = {
  email: string | null;
  orders: Order[];
  signIn: (email: string) => void;
  signOut: () => void;
  addOrder: (o: Order) => void;
};

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      email: null,
      orders: [],
      signIn: (email) => set({ email }),
      signOut: () => set({ email: null }),
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders].slice(0, 20) })),
    }),
    { name: "store-account" },
  ),
);

/** One garment per layer; re-tapping a worn piece takes it off. */
type FittingState = {
  open: boolean;
  equipped: Partial<Record<Layer, number>>;
  apiKey: string | null;
  setOpen: (v: boolean) => void;
  toggle: (productId: number) => "added" | "removed";
  unequip: (layer: Layer) => void;
  reset: () => void;
  setApiKey: (key: string | null) => void;
};

export const useFitting = create<FittingState>()(
  persist(
    (set, get) => ({
      open: false,
      equipped: {},
      apiKey: null,
      setOpen: (open) => set({ open }),
      toggle: (productId) => {
        const p = productById(productId);
        if (!p) return "removed";
        const layer = layerOf(p);
        const worn = get().equipped[layer] === productId;
        set((s) => {
          const equipped = { ...s.equipped };
          if (worn) delete equipped[layer];
          else equipped[layer] = productId;
          return { equipped, open: true };
        });
        return worn ? "removed" : "added";
      },
      unequip: (layer) =>
        set((s) => {
          const equipped = { ...s.equipped };
          delete equipped[layer];
          return { equipped };
        }),
      reset: () => set({ equipped: {} }),
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    { name: "store-fitting", partialize: (s) => ({ equipped: s.equipped, apiKey: s.apiKey }) },
  ),
);

type UiState = {
  searchOpen: boolean;
  toast: string | null;
  setSearchOpen: (v: boolean) => void;
  showToast: (msg: string) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiState>()((set) => ({
  searchOpen: false,
  toast: null,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  showToast: (toast) => {
    clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },
}));

const noop = () => () => {};
/** True once running in the browser, so persisted state renders without hydration mismatches. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** Who is trying things on: the demo mannequin or the customer's own photo. */
export type TryOnPhoto = {
  src: string;
  w: number;
  h: number;
  joints: import("./pose").Joints;
  /** "detected" = pose found; "estimated" = fell back to standard proportions. */
  fit: "detected" | "estimated";
};

type TryOnState = {
  source: "model" | "photo";
  photo: TryOnPhoto | null;
  detecting: boolean;
  /** Manual nudges per layer, kept separately for the mannequin and the photo. */
  adjust: Record<"model" | "photo", Partial<Record<Layer, import("./fit").Adjust>>>;
  setSource: (s: "model" | "photo") => void;
  setPhoto: (p: TryOnPhoto | null) => void;
  setDetecting: (v: boolean) => void;
  nudge: (layer: Layer, patch: Partial<import("./fit").Adjust>) => void;
  resetAdjust: (layer?: Layer) => void;
};

// Not persisted: a full-size photo is too big for localStorage and stays in memory only.
export const useTryOn = create<TryOnState>()((set) => ({
  source: "model",
  photo: null,
  detecting: false,
  adjust: { model: {}, photo: {} },
  setSource: (source) => set({ source }),
  setPhoto: (photo) => set((s) => ({ photo, source: photo ? "photo" : s.source, adjust: { ...s.adjust, photo: {} } })),
  setDetecting: (detecting) => set({ detecting }),
  nudge: (layer, patch) =>
    set((s) => {
      const cur = s.adjust[s.source][layer] ?? { dx: 0, dy: 0, scale: 1 };
      return { adjust: { ...s.adjust, [s.source]: { ...s.adjust[s.source], [layer]: { ...cur, ...patch } } } };
    }),
  resetAdjust: (layer) =>
    set((s) => {
      if (!layer) return { adjust: { ...s.adjust, [s.source]: {} } };
      const next = { ...s.adjust[s.source] };
      delete next[layer];
      return { adjust: { ...s.adjust, [s.source]: next } };
    }),
}));
