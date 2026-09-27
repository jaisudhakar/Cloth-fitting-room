"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/components/I18nProvider";

export default function NotFound() {
  const { d, href } = useI18n();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--accent-text)]">404</p>
      <h1 className="mt-3 text-4xl font-light">{d.common.notFoundTitle}</h1>
      <p className="mt-3 text-[var(--text-muted)]">{d.common.notFoundText}</p>
      <ButtonLink href={href("/")} className="mt-8">
        {d.common.backHome}
      </ButtonLink>
    </div>
  );
}
