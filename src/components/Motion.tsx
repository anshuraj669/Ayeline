"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reveals every `[data-reveal]` element as it scrolls into view. Content is only hidden
 * once this has mounted (the `js-reveal` class), so it is never lost without JavaScript.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-revealed", "");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
    };
    scan();
    // Batched per frame: count-ups and the ticker mutate the DOM constantly.
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}

/** Counts up to `value` when it first appears. Screen readers get the final number straight away. */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let frame = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 4))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);
  return (
    <>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

/**
 * A pill that glides between the options of a segmented control. Mark the active option
 * with `data-active="true"`; the returned refs go on the container and the pill.
 */
export function useIndicator<C extends HTMLElement, P extends HTMLElement>(active: unknown) {
  const container = useRef<C>(null);
  const pill = useRef<P>(null);
  useLayoutEffect(() => {
    const root = container.current;
    const el = pill.current;
    if (!root || !el) return;
    const place = () => {
      const target = root.querySelector<HTMLElement>('[data-active="true"]');
      if (!target) {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.style.width = `${target.offsetWidth}px`;
      el.style.height = `${target.offsetHeight}px`;
      el.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(root);
    root.querySelectorAll(":scope > *").forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [active]);
  return [container, pill] as const;
}
