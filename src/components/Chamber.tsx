"use client";

import { useState } from "react";
import { COUNCIL_SIZE, PLACE } from "@/lib/data";

const MAJORITY = Math.floor(COUNCIL_SIZE / 2) + 1;

/**
 * The council chamber from above: seven seats around the dais. After a vote each seat
 * lights up in turn with how that member voted; before one, the seats wait in a slow wave.
 */
export function Chamber({ result }: { result?: { yes: number; no: number } }) {
  // Phones have no hover, so a tap shows a member's name instead.
  const [open, setOpen] = useState<number | null>(null);
  const seats = PLACE.roster.map((m, i) => {
    // Spread along a half circle, left to right.
    const angle = Math.PI - (i / (PLACE.roster.length - 1)) * Math.PI;
    return {
      ...m,
      left: 50 + Math.cos(angle) * 42,
      top: 88 - Math.sin(angle) * 74,
      vote: result ? (i < result.yes ? "yes" : i < result.yes + result.no ? "no" : "absent") : null,
    };
  });

  return (
    <div data-reveal>
      <div className="relative mx-auto aspect-[2/1.15] w-full max-w-sm">
        <svg viewBox="0 0 200 115" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="chamber-arc" x1="0" x2="1">
              <stop offset="0" stopColor="#6ff0d8" />
              <stop offset="0.5" stopColor="#ffc56e" />
              <stop offset="1" stopColor="#ff8f7a" />
            </linearGradient>
          </defs>
          <path d="M16 101 A84 84 0 0 1 184 101" fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M16 101 A84 84 0 0 1 184 101"
            fill="none"
            stroke="url(#chamber-arc)"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="arc-draw"
          />
          <path d="M70 112 Q100 84 130 112" fill="rgb(111 240 216 / 0.08)" stroke="rgb(111 240 216 / 0.3)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          {result ? (
            <p className="dot-pop font-display text-2xl font-extrabold" style={{ ["--i" as string]: COUNCIL_SIZE + 1 }}>
              <span className="text-support">{result.yes}</span>
              <span className="text-muted"> – </span>
              <span className="text-oppose">{result.no}</span>
            </p>
          ) : (
            <p className="text-xs font-bold text-muted">
              <span className="font-display text-2xl font-extrabold text-ink">{MAJORITY}</span> of {COUNCIL_SIZE} to pass
            </p>
          )}
        </div>
        {seats.map((s, i) => (
          <span
            key={s.name}
            aria-hidden="true"
            className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:z-20 ${open === i ? "z-20" : ""}`}
            style={{ left: `${s.left}%`, top: `${s.top}%` }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[0.7rem] font-extrabold ring-2 transition duration-300 group-hover:scale-125 ${
                s.vote ? "dot-pop" : "seat-wave"
              } ${
                s.vote === "yes"
                  ? "bg-support-solid text-white ring-support shadow-[0_0_18px_rgb(134_239_172/0.7)]"
                  : s.vote === "no"
                    ? "bg-oppose-solid text-white ring-oppose shadow-[0_0_18px_rgb(255_143_122/0.7)]"
                    : "bg-white/5 text-ink/80 ring-white/20"
              }`}
              style={{ ["--i" as string]: i * 1.6 }}
            >
              {s.initials}
            </span>
            {/* Seats near the edges open their label inward, so it stays on screen. */}
            <span
              className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-[11rem] rounded-xl bg-night/95 px-2.5 py-1.5 text-xs ring-1 ring-line transition duration-300 ease-spring ${
                s.left < 25 ? "left-0 text-left" : s.left > 75 ? "right-0 text-right" : "left-1/2 -translate-x-1/2 text-center"
              } ${open === i ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-90 opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"}`}
            >
              <span className="block font-bold">{s.name}</span>
              <span className="text-muted">
                {s.seat}
                {s.vote && ` · voted ${s.vote}`}
              </span>
            </span>
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {seats.map((s) => (
          <li key={s.name}>
            {s.name}, {s.seat}
            {s.vote ? `: voted ${s.vote}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
