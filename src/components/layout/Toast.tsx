"use client";

import { IconCircleCheck } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useUi } from "@/lib/store";

export function Toast() {
  const toast = useUi((s) => s.toast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[120] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-full bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-[var(--text)] shadow-[0_8px_24px_-8px_rgba(16,16,20,0.2)]"
          >
            <IconCircleCheck size={18} className="text-[var(--primaryColor)]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
