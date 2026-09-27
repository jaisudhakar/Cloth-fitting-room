import data from "@/data/catalog.json";
import type { Locale } from "./i18n";

export type Localized = { en: string; ar: string };

export type Category = {
  id: number;
  slug: string;
  name: Localized;
  description: Localized;
  image: string;
};

export type Product = {
  id: number;
  slug: string;
  sku: string;
  name: Localized;
  description: Localized;
  longDescription: Localized;
  price: number;
  compareAtPrice: number | null;
  categoryId: number;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  image: string;
  /** Visible garment area within the square cut-out: [x, y, w, h] as fractions. */
  bbox: [number, number, number, number];
  colors: { value: string; label: Localized; hex: string; stock: number }[];
  sizes: { type: string; value: string; stock: number }[];
};

export const CATEGORIES = data.categories as Category[];
/** Newest first, as the reference shop lists them. */
export const PRODUCTS = data.products as unknown as Product[];
export const HOME = data.home;

export const t = (v: Localized, lang: Locale) => v[lang] ?? v.en;
export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productById = (id: number) => PRODUCTS.find((p) => p.id === id);
export const categoryById = (id: number) => CATEGORIES.find((c) => c.id === id);
export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const productsBySlugs = (slugs: string[]) => slugs.map(productBySlug).filter((p): p is Product => !!p);
export const onSale = (p: Product) => p.compareAtPrice !== null && p.compareAtPrice > p.price;

export function relatedProducts(p: Product, n = 4) {
  const same = PRODUCTS.filter((x) => x.id !== p.id && x.categoryId === p.categoryId);
  const rest = PRODUCTS.filter((x) => x.id !== p.id && x.categoryId !== p.categoryId);
  return [...same, ...rest].slice(0, n);
}

/** Fitting-room layer a product occupies, head to toe. */
export type Layer = "headwear" | "top" | "outerwear" | "bottom" | "footwear";
export const LAYERS: Layer[] = ["headwear", "top", "outerwear", "bottom", "footwear"];

const LAYER_BY_CATEGORY: Record<string, Layer> = {
  hats: "headwear",
  "t-shirts": "top",
  shirts: "top",
  "hoodies-sweatshirts": "top",
  "jackets-outerwear": "outerwear",
  "pants-trousers": "bottom",
  "shoes-sneakers": "footwear",
};

export function layerOf(p: Product): Layer {
  const slug = categoryById(p.categoryId)?.slug ?? "";
  return LAYER_BY_CATEGORY[slug] ?? "top";
}

export function searchProducts(q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return PRODUCTS.filter((p) => {
    const cat = categoryById(p.categoryId);
    const hay = [p.name.en, p.name.ar, p.description.en, p.sku, ...p.tags, cat?.name.en ?? "", cat?.name.ar ?? ""].join(" ").toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}
