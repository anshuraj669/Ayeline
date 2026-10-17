"use client";

import { useRef } from "react";

/** Lets its child lean a little toward the pointer, as if drawn to it. */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mgx", `${(e.clientX - r.left - r.width / 2) * strength}px`);
    el.style.setProperty("--mgy", `${(e.clientY - r.top - r.height / 2) * strength}px`);
  };
  const onLeave = () => {
    ref.current!.style.setProperty("--mgx", "0px");
    ref.current!.style.setProperty("--mgy", "0px");
  };
  return (
    <span ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="magnetic inline-block p-2 -m-2">
      {children}
    </span>
  );
}
