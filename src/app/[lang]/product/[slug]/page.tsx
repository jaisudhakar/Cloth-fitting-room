import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetail } from "@/components/product/ProductDetail";
import { LOCALES, hasLocale } from "@/lib/i18n";
import { PRODUCTS, productBySlug } from "@/lib/products";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PRODUCTS.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = productBySlug(slug);
  if (!p || !hasLocale(lang)) return {};
  return { title: p.name[lang], description: p.description[lang] };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  return (
    <Suspense>
      <ProductDetail productId={p.id} />
    </Suspense>
  );
}
