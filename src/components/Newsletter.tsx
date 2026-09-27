"use client";

import { useState } from "react";
import { useI18n } from "./providers/I18nProvider";

export function Newsletter() {
  const { d } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <section className="container-x py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl">{d.home.newsletterTitle}</h2>
        <p className="mt-2 text-fg-muted">{d.home.newsletterText}</p>
        {done ? (
          <p className="mt-6 rounded-xl bg-success/10 p-4 text-sm text-success" role="status">
            {d.home.subscribed}
          </p>
        ) : (
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <input type="email" required placeholder={d.home.emailPlaceholder} className="input h-12 rounded-full" aria-label={d.home.emailPlaceholder} />
            <button className="btn-primary h-12 px-6">{d.home.subscribe}</button>
          </form>
        )}
      </div>
    </section>
  );
}
