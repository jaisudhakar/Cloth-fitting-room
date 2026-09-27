import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { PRODUCTS, productBySlug } from "@/lib/catalog";
import { LOCALES, hasLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PRODUCTS.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = productBySlug(slug);
  if (!p || !hasLocale(lang)) return {};
  return { title: p.name[lang], description: p.description[lang] };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  return <ProductDetail key={p.id} productId={p.id} />;
}
