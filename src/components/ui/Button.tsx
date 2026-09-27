"use client";

import Link from "next/link";
import { forwardRef, useCallback } from "react";

type Variant = "primary" | "outline" | "soft" | "white";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--primaryColor)] text-[var(--on-primary)] hover:bg-[var(--primaryColorHover)]",
  outline: "border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-muted)]/30",
  soft: "bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--border)]",
  white: "bg-white text-[#111111] hover:bg-white/90",
};
const SIZES: Record<Size, string> = { md: "h-11 px-6", lg: "h-12 px-8" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full text-sm font-medium transition-[transform,opacity,background-color] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primaryColor)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

/** Material-style ripple from the click point, like the reference buttons. */
export function useRipple() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 650);
  }, []);
}

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export const Button = forwardRef<HTMLButtonElement, Common & React.ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { variant = "primary", size = "md", className = "", children, onPointerDown, ...rest },
  ref,
) {
  const ripple = useRipple();
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", className = "", children }: Common & { href: string }) {
  const ripple = useRipple();
  return (
    <Link href={href} className={buttonClass(variant, size, className)} onPointerDown={ripple}>
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}
