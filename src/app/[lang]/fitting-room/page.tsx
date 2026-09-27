import type { Metadata } from "next";
import { Suspense } from "react";
import { FittingRoom } from "@/components/fitting/FittingRoom";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/fitting-room">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).fitting.title } : {};
}

export default function FittingRoomPage() {
  return (
    <Suspense>
      <FittingRoom />
    </Suspense>
  );
}
