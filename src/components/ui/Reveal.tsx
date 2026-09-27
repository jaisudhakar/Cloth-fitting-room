"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fades (and optionally slides) content in the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  x = 0,
  y = 24,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  x?: number;
  y?: number;
  delay?: number;
  as?: "div" | "section";
}) {
  const reduce = useReducedMotion();
  const Comp = as === "section" ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Comp>
  );
}
