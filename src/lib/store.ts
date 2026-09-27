"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NO_ADJUST, type Adjust } from "./fit";
import { SLOT_OF, type Slot } from "./garments";
import { PRODUCTS, productById } from "./products";
import type { Measurements } from "./sizing";

export type CartLine = { key: string; productId: string; color: string; size: string; qty: number };

const lineKey = (productId: string, color: string, size: string) => `${productId}|${color}|${size}`;

export const PROMOS: Record<string, number> = { WELCOME10: 0.1, FITROOM15: 0.15 };
export const FREE_SHIPPING_AT = 100;
export const EXPRESS_COST = 15;
export const STANDARD_COST = 7;

type CartState = {
  lines: CartLine[];
  promo: string | null;
  add: (productId: string, color: string, size: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyPromo: (code: string) => boolean;
  removePromo: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promo: null,
      add: (productId, color, size, qty = 1) =>
        set((s) => {
          const key = lineKey(productId, color, size);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(10, l.qty + qty) } : l)) };
          }
          return { lines: [...s.lines, { key, productId, color, size, qty }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [], promo: null }),
      applyPromo: (code) => {
        const c = code.trim().toUpperCase();
        if (!(c in PROMOS)) return false;
        set({ promo: c });
        return true;
      },
      removePromo: () => set({ promo: null }),
    }),
    { name: "vestra-cart" },
  ),
);

export function cartTotals(lines: CartLine[], promo: string | null, express = false) {
  const subtotal = lines.reduce((sum, l) => sum + (productById(l.productId)?.price ?? 0) * l.qty, 0);
  const discount = promo ? Math.round(subtotal * (PROMOS[promo] ?? 0) * 100) / 100 : 0;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const shipping = count === 0 ? 0 : express ? EXPRESS_COST : subtotal - discount >= FREE_SHIPPING_AT ? 0 : STANDARD_COST;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, count };
}

type WishlistState = { ids: string[]; toggle: (id: string) => void; remove: (id: string) => void };

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: "vestra-wishlist" },
  ),
);

type ProfileState = {
  measurements: Measurements | null;
  setMeasurements: (m: Measurements) => void;
  recent: string[];
  view: (id: string) => void;
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      measurements: null,
      setMeasurements: (measurements) => set({ measurements }),
      recent: [],
      view: (id) => set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 8) })),
    }),
    { name: "vestra-profile" },
  ),
);

export type Order = {
  id: string;
  email: string;
  name: string;
  lines: CartLine[];
  totals: ReturnType<typeof cartTotals>;
  createdAt: number;
};

type OrdersState = { orders: Order[]; place: (o: Order) => void };

export const useOrders = create<OrdersState>()(
  persist((set) => ({ orders: [], place: (o) => set((s) => ({ orders: [o, ...s.orders].slice(0, 20) })) }), {
    name: "vestra-orders",
  }),
);

/** A garment on the fitting-room model. */
export type Worn = { productId: string; color: string; size: string; adjust: Adjust };

type FittingState = {
  outfit: Partial<Record<Slot, Worn>>;
  wear: (productId: string, color?: string, size?: string) => void;
  takeOff: (slot: Slot) => void;
  update: (slot: Slot, patch: Partial<Omit<Worn, "productId">>) => void;
  adjust: (slot: Slot, patch: Partial<Adjust>) => void;
  clear: () => void;
};

export const useFitting = create<FittingState>()(
  persist(
    (set) => ({
      outfit: {},
      wear: (productId, color, size) =>
        set((s) => {
          const p = productById(productId);
          if (!p) return s;
          const slot = SLOT_OF[p.kind];
          const outfit = { ...s.outfit };
          // A dress replaces separates and vice versa.
          if (slot === "onepiece") {
            delete outfit.top;
            delete outfit.bottom;
          } else if (slot === "top" || slot === "bottom") {
            delete outfit.onepiece;
          }
          const prev = outfit[slot];
          outfit[slot] = {
            productId,
            color: color ?? p.colors[0].hex,
            size: size ?? p.sizes[Math.floor(p.sizes.length / 2) - 1] ?? p.sizes[0],
            adjust: prev?.productId === productId ? prev.adjust : NO_ADJUST,
          };
          return { outfit };
        }),
      takeOff: (slot) =>
        set((s) => {
          const outfit = { ...s.outfit };
          delete outfit[slot];
          return { outfit };
        }),
      update: (slot, patch) =>
        set((s) => {
          const w = s.outfit[slot];
          return w ? { outfit: { ...s.outfit, [slot]: { ...w, ...patch } } } : s;
        }),
      adjust: (slot, patch) =>
        set((s) => {
          const w = s.outfit[slot];
          return w ? { outfit: { ...s.outfit, [slot]: { ...w, adjust: { ...w.adjust, ...patch } } } } : s;
        }),
      clear: () => set({ outfit: {} }),
    }),
    {
      name: "vestra-fitting",
      // Drop pieces whose product no longer exists.
      merge: (persisted, current) => {
        const p = persisted as Partial<FittingState> | undefined;
        const outfit = Object.fromEntries(
          Object.entries(p?.outfit ?? {}).filter(([, w]) => w && PRODUCTS.some((x) => x.id === w.productId)),
        );
        return { ...current, outfit };
      },
    },
  ),
);

const noopSubscribe = () => () => {};

/** True after the first client render, so persisted state can render without hydration mismatches. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type UiState = {
  cartOpen: boolean;
  searchOpen: boolean;
  toast: string | null;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  showToast: (msg: string) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  toast: null,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  showToast: (toast) => {
    clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
