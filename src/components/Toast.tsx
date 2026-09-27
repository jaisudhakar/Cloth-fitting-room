"use client";

import { CheckCircle2 } from "lucide-react";
import { useUi } from "@/lib/store";

export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="toast fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-fg shadow-lg"
    >
      <CheckCircle2 className="size-4" />
      {toast}
    </div>
  );
}
