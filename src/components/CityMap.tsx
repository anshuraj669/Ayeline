"use client";

import Link from "next/link";
import { useState } from "react";
import { ITEMS, MAP, PLACE, NEIGHBORHOODS, TOPICS, type Neighborhood } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";

// Isometric projection: grid units to SVG points.
const S = 104;
const OX = 250;
const OY = 40;
const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * S, OY + (x + y) * S * 0.5 - z];
const pts = (list: [number, number][]) => list.map((p) => p.join(",")).join(" ");

const DISTRICTS = MAP.districts;
const NAMES = Object.keys(DISTRICTS) as Neighborhood[];

// A few buildings per district, from a fixed seed so server and client agree.
function blocks(seed: number, tall?: boolean) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (let gx = 0; gx < 3; gx++) {
    for (let gy = 0; gy < 3; gy++) {
      if (rand() < 0.35 || (gx === 1 && gy === 1)) continue;
      out.push({ x: 0.1 + gx * 0.29, y: 0.1 + gy * 0.29, w: 0.18 + rand() * 0.04, h: 8 + rand() * (tall ? 40 : 18) });
    }
  }
  // Paint back to front.
  return out.sort((a, b) => a.x + a.y - (b.x + b.y));
}
const BLOCKS = Object.fromEntries(NAMES.map((n, i) => [n, blocks(11 + i * 18, DISTRICTS[n].tall)])) as Record<
  Neighborhood,
  ReturnType<typeof blocks>
>;

// Fit the drawing to whatever layout data.ts describes, leaving room for pins and labels.
const left = Math.min(...NAMES.map((n) => DISTRICTS[n].x)) - 0.3;
const right = Math.max(...NAMES.map((n) => DISTRICTS[n].x)) + 1.33;
const corners = NAMES.flatMap((n) => {
  const { x, y } = DISTRICTS[n];
  return [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)];
});
const riverCorners = MAP.river ? [iso(left, MAP.river.from), iso(right, MAP.river.to)] : [];
const xs = [...corners, ...riverCorners].map((p) => p[0]);
const ys = corners.map((p) => p[1]);
const VIEW = {
  x: Math.min(...xs) - 12,
  y: Math.min(...ys) - 50,
  w: Math.max(...xs) - Math.min(...xs) + 24,
  h: Math.max(...ys) - Math.min(...ys) + 95,
};

function Box({ x, y, w, h, top, left, right }: { x: number; y: number; w: number; h: number; top: string; left: string; right: string }) {
  const a = iso(x, y, h);
  const b = iso(x + w, y, h);
  const c = iso(x + w, y + w, h);
  const d = iso(x, y + w, h);
  const c0 = iso(x + w, y + w);
  const d0 = iso(x, y + w);
  const b0 = iso(x + w, y);
  return (
    <g>
      <polygon points={pts([d, c, c0, d0])} fill={left} />
      <polygon points={pts([b, c, c0, b0])} fill={right} />
      <polygon points={pts([a, b, c, d])} fill={top} />
    </g>
  );
}

/** The city in miniature: pick a neighborhood to see what's on the agenda there. */
export function CityMap() {
  const s = useStore();
  const hydrated = useHydrated();
  const home = hydrated ? s.neighborhood : null;
  const [picked, setPicked] = useState<Neighborhood | null>(null);
  const [hover, setHover] = useState<Neighborhood | null>(null);
  const selected = picked ?? home ?? NEIGHBORHOODS[0];
  const upcoming = ITEMS.filter((i) => i.status === "upcoming");
  const inDistrict = (n: Neighborhood) => upcoming.filter((i) => i.neighborhoods !== "citywide" && i.neighborhoods.includes(n));
  const citywide = upcoming.filter((i) => i.neighborhoods === "citywide");
  const list = inDistrict(selected);

  return (
    <section id="map" aria-labelledby="map-title" className="mb-12 scroll-mt-28">
      <div data-reveal>
        <h2 id="map-title" className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight">
          What&apos;s happening where
          <span aria-hidden="true" className="grow-x h-px max-w-40 flex-1 bg-gradient-to-r from-glow/70 via-accent/40 to-transparent" />
        </h2>
        <p className="text-muted">Pick a neighborhood. {citywide.length} more items affect the whole {PLACE.words.area}.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div data-reveal className="glass relative overflow-hidden rounded-[32px] p-3 sm:p-5">
          <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="h-auto w-full" aria-hidden="true">
            <defs>
              <linearGradient id="map-river" x1="0" x2="1">
                <stop offset="0" stopColor="#1fb5a3" stopOpacity="0.2" />
                <stop offset="0.5" stopColor="#6ff0d8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#1fb5a3" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="map-sel" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#16656b" />
                <stop offset="1" stopColor="#0e4a52" />
              </linearGradient>
            </defs>
            {/* A river across town, if data.ts has one. */}
            {MAP.river && (
              <polygon
                points={pts([iso(left, MAP.river.from), iso(right, MAP.river.from), iso(right, MAP.river.to), iso(left, MAP.river.to)])}
                fill="url(#map-river)"
                className="river"
              />
            )}
            {[...NAMES]
              .sort((a, b) => DISTRICTS[a].x + DISTRICTS[a].y - (DISTRICTS[b].x + DISTRICTS[b].y))
              .map((n) => {
                const { x, y } = DISTRICTS[n];
                const sel = n === selected;
                const lifted = sel || n === hover;
                const items = inDistrict(n);
                const center = iso(x + 0.5, y + 0.5, 0);
                return (
                  <g
                    key={n}
                    onClick={() => setPicked(n)}
                    onPointerEnter={() => setHover(n)}
                    onPointerLeave={() => setHover(null)}
                    className="cursor-pointer transition-transform duration-500 ease-spring"
                    style={{ transform: `translateY(${lifted ? -10 : 0}px)` }}
                  >
                    {/* Ground slab with its two visible edges. */}
                    <polygon points={pts([iso(x, y + 1), iso(x + 1, y + 1), iso(x + 1, y + 1, -12), iso(x, y + 1, -12)])} fill="#04222a" />
                    <polygon points={pts([iso(x + 1, y), iso(x + 1, y + 1), iso(x + 1, y + 1, -12), iso(x + 1, y, -12)])} fill="#03181e" />
                    <polygon
                      points={pts([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)])}
                      fill={sel ? "url(#map-sel)" : "#0a3039"}
                      stroke={sel ? "#6ff0d8" : "rgb(210 255 245 / 0.14)"}
                      strokeWidth={sel ? 1.5 : 1}
                      style={{ filter: sel ? "drop-shadow(0 0 14px rgb(111 240 216 / 0.55))" : undefined, transition: "fill 0.4s" }}
                    />
                    {BLOCKS[n].map((b, i) => (
                      <Box
                        key={i}
                        x={x + b.x}
                        y={y + b.y}
                        w={b.w}
                        h={b.h}
                        top={sel ? "#3fb7a8" : "#1b5a64"}
                        left={sel ? "#13675f" : "#0d3c45"}
                        right={sel ? "#0d4c48" : "#082d34"}
                      />
                    ))}
                    {/* Pins for each item here. */}
                    {items.map((item, i) => {
                      const [px, py] = [center[0] + (i - (items.length - 1) / 2) * 26, center[1] - 6];
                      const color = TOPICS[item.topic].color;
                      return (
                        <g key={item.id}>
                          <ellipse cx={px} cy={py + 2} rx="9" ry="4.5" fill="none" stroke={color} className="pin-ripple" style={{ animationDelay: `${i * 0.6}s` }} />
                          <g className="pin-bob" style={{ animationDelay: `${i * 0.4}s` }}>
                            <line x1={px} x2={px} y1={py} y2={py - 26} stroke={color} strokeWidth="1.5" />
                            <circle cx={px} cy={py - 32} r="9" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
                            <text x={px} y={py - 28.5} textAnchor="middle" fontSize="10">
                              {TOPICS[item.topic].emoji}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            {/* Labels go on top of everything so no district hides another's name. */}
            {NAMES.map((n) => {
              const { x, y } = DISTRICTS[n];
              const sel = n === selected;
              const [lx, ly] = iso(x + 1, y + 1);
              return (
                <text
                  key={n}
                  x={lx}
                  y={ly + 30 - (sel || n === hover ? 10 : 0)}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill={sel ? "#6ff0d8" : "#cfe3e0"}
                  stroke="#021219"
                  strokeWidth="4"
                  paintOrder="stroke"
                  className="pointer-events-none"
                  style={{ letterSpacing: "0.14em", transition: "fill 0.4s, y 0.5s var(--ease-spring)" }}
                >
                  {n.toUpperCase()}
                  {n === home ? " · YOU" : ""}
                </text>
              );
            })}
          </svg>
        </div>

        <div data-reveal style={{ ["--d" as string]: "120ms" }}>
          <div role="group" aria-label="Neighborhood" className="mb-4 flex flex-wrap gap-2">
            {NEIGHBORHOODS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={n === selected}
                onClick={() => setPicked(n)}
                onPointerEnter={() => setHover(n)}
                onPointerLeave={() => setHover(null)}
                className={`chip-pop rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition duration-300 ${
                  n === selected ? "border-glow bg-navy text-white shadow-[0_0_20px_-4px_rgb(111_240_216/0.8)]" : "border-line bg-white/5 hover:border-glow/60"
                }`}
              >
                {n}
                {n === home && <span className="sr-only"> (where you live)</span>}
              </button>
            ))}
          </div>
          <div key={selected} className="glass-strong window-open rounded-[28px] p-5">
            <p className="eyebrow text-accent">{selected === home ? "Your neighborhood" : "Neighborhood"}</p>
            <h3 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{selected}</h3>
            <p className="mt-1 text-sm text-muted">{DISTRICTS[selected].blurb}</p>
            {list.length ? (
              <ul className="mt-4 space-y-2">
                {list.map((i, n) => (
                  <li key={i.id} className="rise" style={{ animationDelay: `${150 + n * 70}ms` }}>
                    <Link
                      href={`/item/${i.id}`}
                      className="group flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-line transition hover:bg-white/[0.08] hover:ring-glow/40"
                    >
                      <span aria-hidden="true" className="text-xl">
                        {TOPICS[i.topic].emoji}
                      </span>
                      <span className="text-sm font-bold leading-snug">{i.title}</span>
                      <span aria-hidden="true" className="ml-auto text-glow transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl bg-white/[0.04] p-4 text-sm text-muted ring-1 ring-line">
                Nothing just for {selected} this time. The {citywide.length} {PLACE.words.everywhere} items still apply here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
