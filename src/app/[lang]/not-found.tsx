"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";

export default function NotFound() {
  const { d, href } = useI18n();
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-4xl">{d.common.notFoundTitle}</h1>
      <p className="mt-3 text-fg-muted">{d.common.notFoundText}</p>
      <Link href={href("/")} className="btn-primary mt-8">
        {d.common.goHome}
      </Link>
    </div>
  );
}
