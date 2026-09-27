import { PRODUCTS } from "./products";

/** Case-insensitive match across both languages, category, gender, kind and colour names. */
export function searchProducts(query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((p) => {
    const hay = [
      p.name.en, p.name.ar, p.description.en, p.category, p.gender, p.kind,
      ...p.colors.flatMap((c) => [c.name.en, c.name.ar]),
    ].join(" ").toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}
