"use client";

import { useRef } from "react";

/**
 * Tilts its content toward the pointer, lifts it slightly toward you and runs a rim of
 * light around the edge nearest the pointer, like a pane of glass catching light. CSS
 * only applies the tilt for hover-capable pointers and when reduced motion isn't
 * requested (see `.tilt` in globals.css).
 */
export function Tilt({
  children,
  className = "",
  max = 5,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };

  const onLeave = () => {
    const el = ref.current!;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt relative ${className}`}>
      {children}
      {glare && (
        <>
          <div aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 rounded-[inherit]" />
          <div aria-hidden="true" className="tilt-rim pointer-events-none absolute inset-0 rounded-[inherit]" />
        </>
      )}
    </div>
  );
}
