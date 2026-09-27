"use client";

import { IconExternalLink, IconKey, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useFitting } from "@/lib/store";
import { useI18n } from "../I18nProvider";
import { Button } from "../ui/Button";

export function ApiKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Dialog onClose={onClose} />}</AnimatePresence>;
}

function Dialog({ onClose }: { onClose: () => void }) {
  const { d } = useI18n();
  const apiKey = useFitting((s) => s.apiKey);
  const setApiKey = useFitting((s) => s.setApiKey);
  const [value, setValue] = useState(apiKey ?? "");
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={d.fitting.keyTitle}>
      <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.form
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative w-full max-w-md rounded-3xl bg-[var(--surface-elevated)] p-6 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          setApiKey(value.trim() || null);
          onClose();
        }}
      >
        <button type="button" onClick={onClose} aria-label={d.common.close} className="absolute end-4 top-4 rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
          <IconX size={16} />
        </button>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primaryColor)]/10 text-[var(--accent-text)]">
          <IconKey size={20} stroke={1.8} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{d.fitting.keyTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{d.fitting.keyText1}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{d.fitting.keyText2}</p>
        <label className="mt-5 block text-sm font-medium text-[var(--text)]" htmlFor="google-ai-key">
          {d.fitting.keyLabel}
        </label>
        <input
          id="google-ai-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={d.fitting.keyPlaceholder}
          className="mt-2 h-11 w-full rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] px-4 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--primaryColor)]"
          dir="ltr"
        />
        <p className="mt-2 text-xs text-[var(--text-muted)]">{d.fitting.keyStored}</p>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline"
        >
          {d.fitting.getKey} <IconExternalLink size={12} />
        </a>
        <div className="mt-6 flex items-center justify-end gap-2">
          {apiKey && (
            <Button
              type="button"
              variant="soft"
              className="h-10 px-4"
              onClick={() => {
                setApiKey(null);
                onClose();
              }}
            >
              {d.fitting.keyRemove}
            </Button>
          )}
          <Button type="submit" className="h-10 px-5" disabled={!value.trim()}>
            {d.fitting.keySave}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
