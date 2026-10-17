"use client";

import { useEffect } from "react";
import { CityFlight } from "./CityFlight";

const STARS = [
  [8, 12], [17, 34], [26, 8], [34, 22], [41, 4], [52, 16], [59, 30], [66, 9],
  [73, 26], [81, 6], [88, 18], [94, 32], [12, 44], [47, 38], [70, 42], [3, 26],
];

const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 2 + (i % 3),
  duration: 16 + ((i * 7) % 14),
  delay: -((i * 5.3) % 28),
  warm: i % 3 !== 0,
}));

/** Pass pointer and scroll position to CSS, which moves each layer by its depth. */
function useSpatialPointer() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let px = 0;
    let py = 0;
    const flush = () => {
      frame = 0;
      root.style.setProperty("--px", ((px / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty("--py", ((py / window.innerHeight) * 2 - 1).toFixed(3));
      root.style.setProperty("--mx", `${px}px`);
      root.style.setProperty("--my", `${py}px`);
      root.style.setProperty("--sy", Math.min(window.scrollY / window.innerHeight, 3).toFixed(3));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      queue();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", queue);
      cancelAnimationFrame(frame);
    };
  }, []);
}

const depth = (x: number, y: number, scroll = 0) => ({
  transform: `translate3d(calc(var(--px, 0) * ${x}px), calc(var(--py, 0) * ${y}px + var(--sy, 0) * ${scroll}px), 0)`,
});

/** The city at blue hour: sky, a great lens for a moon, and a slow flight down the avenue toward City Hall. Purely decorative. */
export function Ambient() {
  useSpatialPointer();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ viewTransitionName: "city-backdrop" }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#010b11_0%,#03202a_30%,#0a3942_50%,#1f4d4c_58%,#05161c_100%)]" />

      <div className="orb orb-a" style={{ width: "44vw", height: "44vw", left: "-12vw", top: "-14vw", background: "rgb(14 124 116 / 0.5)" }} />
      <div className="orb orb-b" style={{ width: "30vw", height: "30vw", right: "18vw", top: "30vh", background: "rgb(201 184 255 / 0.12)" }} />

      {STARS.map(([x, y], i) => (
        <span
          key={i}
          className="twinkle absolute h-[2px] w-[2px] rounded-full bg-white shadow-[0_0_6px_2px_rgb(200_255_245/0.5)]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.37) % 3.5}s` }}
        />
      ))}

      {/* The lens: a moon you can see the city through. */}
      <div className="parallax absolute right-[-8vw] top-[9vh] h-[34vw] min-h-[280px] w-[34vw] min-w-[280px]" style={depth(18, 12, -40)}>
        <div className="absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle_at_34%_28%,rgb(255_255_255/0.16),rgb(111_240_216/0.06)_35%,rgb(2_18_25/0.2)_70%)] shadow-[inset_0_0_80px_rgb(111_240_216/0.14),0_0_160px_rgb(111_240_216/0.12)] backdrop-blur-[2px]" />
        <svg viewBox="0 0 200 200" className="spin-slow absolute inset-[-6%] h-[112%] w-[112%]">
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgb(111 240 216 / 0.35)" strokeWidth="0.6" strokeDasharray="0.6 4.4" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgb(255 197 110 / 0.28)" strokeWidth="0.4" strokeDasharray="14 6 2 6" />
        </svg>
        <svg viewBox="0 0 200 200" className="spin-rev absolute inset-[8%] h-[84%] w-[84%]">
          <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(201 184 255 / 0.22)" strokeWidth="0.5" strokeDasharray="40 14" />
        </svg>
        <div className="absolute left-[22%] top-[16%] h-[18%] w-[30%] rotate-[-30deg] rounded-full bg-white/10 blur-xl" />
      </div>

      <CityFlight />
      {/* A soft wash where the text sits, so the passing city never fights the words. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_58%_at_50%_42%,rgb(2_14_20/0.62),rgb(2_14_20/0.25)_60%,transparent_85%)]" />

      <div className="gaze" />

      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            background: m.warm ? "#ffd88a" : "#8ff5e2",
            boxShadow: `0 0 ${m.size * 4}px ${m.warm ? "rgb(255 200 120 / 0.8)" : "rgb(111 240 216 / 0.8)"}`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}

    </div>
  );
}
