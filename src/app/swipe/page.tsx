"use client";

import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { CountUp } from "@/components/Motion";
import { toast } from "@/components/Toast";
import { TopicTag } from "@/components/TopicTag";
import { ITEMS, PERSONAS, PLACE, meetingFor, type AgendaItem } from "@/lib/data";
import { clearReactions, removeReaction, setReaction, useHydrated, useStore, type Reaction } from "@/lib/store";
import { daysFromToday, fmt, inDays, isRelevant, relevance, whereLabel } from "@/lib/util";

const FLING = 120; // px of drag before a release counts as a decision
const UPCOMING = ITEMS.filter((i) => i.status === "upcoming");

const REACT: Record<Reaction, { label: string; icon: string; color: string }> = {
  support: { label: "Support", icon: "♥", color: "var(--support)" },
  oppose: { label: "Oppose", icon: "✕", color: "var(--oppose)" },
  skip: { label: "Not sure", icon: "↑", color: "var(--muted)" },
};

export default function SwipePage() {
  const s = useStore();
  const hydrated = useHydrated();
  const [history, setHistory] = useState<string[]>([]);

  // Items that touch you come first.
  const deck = UPCOMING.filter((i) => !s.reactions[i.id]).sort(
    (a, b) => Number(isRelevant(relevance(b, s))) - Number(isRelevant(relevance(a, s))),
  );
  const done = UPCOMING.length - deck.length;

  const decide = (item: AgendaItem, r: Reaction) => {
    setReaction(item.id, r);
    setHistory((h) => [...h, item.id]);
    if (deck.length === 1) toast("That's the whole agenda!", "🎉");
  };
  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    removeReaction(last);
    setHistory((h) => h.slice(0, -1));
    toast("Brought it back", "↶");
  };

  return (
    <div className="overflow-x-clip py-10">
      <div className="text-center">
        <p className="eyebrow rise text-glow">Quick take · about a minute</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight [perspective:800px] sm:text-5xl">
          <span className="word">Swipe</span>{" "}
          <span className="word" style={{ ["--i" as string]: 1 }}>
            through
          </span>{" "}
          <span className="word font-serif text-[1.15em] font-normal italic" style={{ ["--i" as string]: 2 }}>
            <span className="text-aurora">the agenda</span>
          </span>
        </h1>
        <p className="rise mx-auto mt-3 max-w-xl text-muted" style={{ animationDelay: "250ms" }}>
          Drag right if you&apos;d support it, left if you&apos;d oppose it, up if you&apos;re not sure. You can turn any of these
          into a real comment at the end.
        </p>
      </div>

      {hydrated && (
        <div
          className="rise mx-auto mt-8 flex max-w-md justify-center gap-1.5"
          style={{ animationDelay: "350ms" }}
          aria-label={`${done} of ${UPCOMING.length} done`}
          role="img"
        >
          {UPCOMING.map((i) => {
            const r = s.reactions[i.id];
            return (
              <span
                key={i.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${r ? "pop" : "bg-white/10"}`}
                style={r ? { background: REACT[r].color, boxShadow: `0 0 10px ${REACT[r].color}` } : undefined}
              />
            );
          })}
        </div>
      )}

      {!hydrated ? (
        <div className="mx-auto mt-10 h-[460px] max-w-md animate-pulse rounded-[32px] bg-white/5" aria-hidden="true" />
      ) : deck.length ? (
        <Deck key={deck[0].id} deck={deck} onDecide={decide} />
      ) : (
        <Summary />
      )}

      {hydrated && deck.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted">
          Keyboard: <kbd className="font-bold text-ink">←</kbd> oppose · <kbd className="font-bold text-ink">↑</kbd> not sure ·{" "}
          <kbd className="font-bold text-ink">→</kbd> support
          {history.length > 0 && (
            <>
              {" · "}
              <button type="button" onClick={undo} className="font-bold text-accent underline underline-offset-4">
                Undo
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function RoundButton({
  label,
  onClick,
  tone,
  big,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "support" | "oppose" | "muted";
  big?: boolean;
  children: React.ReactNode;
}) {
  const color = tone === "support" ? "var(--support)" : tone === "oppose" ? "var(--oppose)" : "var(--muted)";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`glass-strong flex items-center justify-center rounded-full font-bold transition duration-300 ease-spring hover:-translate-y-1 hover:scale-110 active:scale-90 ${
        big ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg"
      }`}
      style={{ color, boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 35%, transparent), 0 16px 40px -14px ${color}` }}
    >
      {children}
    </button>
  );
}

function Deck({ deck, onDecide }: { deck: AgendaItem[]; onDecide: (item: AgendaItem, r: Reaction) => void }) {
  const top = deck[0];
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [fly, setFly] = useState<Reaction | null>(null);
  const start = useRef({ x: 0, y: 0, t: 0 });

  const release = (r: Reaction) => {
    if (fly) return;
    setFly(r);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => onDecide(top, r), reduce ? 0 : 380);
  };

  // Arrow keys decide too, as long as focus isn't in a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, [role=dialog]")) return;
      const r = e.key === "ArrowRight" ? "support" : e.key === "ArrowLeft" ? "oppose" : e.key === "ArrowUp" ? "skip" : null;
      if (r) {
        e.preventDefault();
        release(r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDrag({ x: 0, y: 0, active: true });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };
  const onUp = () => {
    if (!drag.active) return;
    const dt = Math.max(1, performance.now() - start.current.t);
    const vx = drag.x / dt;
    if (drag.y < -FLING && Math.abs(drag.x) < FLING) release("skip");
    else if (drag.x > FLING || vx > 0.7) release("support");
    else if (drag.x < -FLING || vx < -0.7) release("oppose");
    setDrag({ x: 0, y: 0, active: false });
  };

  const flyTo =
    fly === "support" ? { x: 700, y: 60 } : fly === "oppose" ? { x: -700, y: 60 } : fly === "skip" ? { x: 0, y: -700 } : null;
  const x = flyTo?.x ?? drag.x;
  const y = flyTo?.y ?? drag.y;
  const lean = Math.max(-1, Math.min(1, x / FLING));
  const up = Math.max(0, Math.min(1, -y / FLING)) * (1 - Math.abs(lean));

  return (
    <>
      <div className="relative mx-auto mt-10 h-[480px] max-w-md [perspective:1400px]">
        {/* The room lights up in the colour of the way you're leaning. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-24 rounded-full blur-3xl transition-opacity duration-300"
          style={{
            opacity: Math.abs(lean) * 0.6,
            background: `radial-gradient(circle, ${lean > 0 ? "rgb(134 239 172 / 0.5)" : "rgb(255 143 122 / 0.5)"}, transparent 65%)`,
          }}
        />
        {deck
          .slice(1, 3)
          .reverse()
          .map((item, i, arr) => {
            const depth = arr.length - i; // 1 is right behind the top card
            const pull = Math.min(1, Math.abs(lean) + up); // back cards step forward as the top one leaves
            const d = depth - pull * 0.9;
            return (
              <div
                key={item.id}
                aria-hidden="true"
                className="absolute inset-0 transition-transform duration-500 ease-spatial"
                style={{ transform: `translateY(${-d * 18}px) scale(${1 - d * 0.06})`, opacity: 1 - d * 0.25 }}
              >
                <Card item={item} />
              </div>
            );
          })}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing ${drag.active ? "" : "transition-transform duration-500 ease-spring"} ${
            fly ? "!duration-[380ms] !ease-in" : ""
          }`}
          style={{ transform: `translate3d(${x}px, ${y}px, 0) rotate(${x / 16}deg) rotateY(${lean * 8}deg)` }}
        >
          <div className="step-forward h-full">
            <Card item={top} live />
          </div>
          <Stamp show={Math.max(0, lean)} color="var(--support)" text="Support" className="left-6 top-8 -rotate-12" />
          <Stamp show={Math.max(0, -lean)} color="var(--oppose)" text="Oppose" className="right-6 top-8 rotate-12" />
          <Stamp show={up} color="var(--lilac)" text="Not sure" className="left-1/2 top-1/3 -translate-x-1/2" />
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <RoundButton label="Oppose" onClick={() => release("oppose")} tone="oppose" big>
          ✕
        </RoundButton>
        <RoundButton label="Not sure, skip" onClick={() => release("skip")} tone="muted">
          ↑
        </RoundButton>
        <RoundButton label="Support" onClick={() => release("support")} tone="support" big>
          ♥
        </RoundButton>
      </div>
    </>
  );
}

function Stamp({ show, color, text, className }: { show: number; color: string; text: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-xl border-4 px-3 py-1 font-display text-2xl font-extrabold uppercase tracking-widest ${className}`}
      style={{ opacity: show, color, borderColor: color, boxShadow: `0 0 30px -6px ${color}`, scale: `${1.4 - show * 0.4}` }}
    >
      {text}
    </span>
  );
}

function Card({ item, live }: { item: AgendaItem; live?: boolean }) {
  const s = useStore();
  const r = relevance(item, s);
  const m = meetingFor(item);
  const total = item.comments.support + item.comments.oppose;
  const persona = r.personas[0];
  return (
    <article className="glass-strong flex h-full flex-col rounded-[32px] bg-[rgb(8_34_42/0.94)] p-6" aria-live={live ? "polite" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <TopicTag topic={item.topic} />
        <span className="text-xs font-bold text-muted">
          Vote {fmt(m.date, { month: "short", day: "numeric" })} · {inDays(daysFromToday(m.date))}
        </span>
      </div>
      {live ? (
        <ViewTransition name={`item-title-${item.id}`} share="morph" default="none">
          <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight">{item.title}</h2>
        </ViewTransition>
      ) : (
        <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight">{item.title}</h2>
      )}
      {persona && item.forYou[persona] ? (
        <p className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgb(111_240_216/0.12),rgb(255_197_110/0.06))] p-3.5 text-sm ring-1 ring-glow/20">
          <strong>{PERSONAS[persona].emoji} For you:</strong> {item.forYou[persona]}
        </p>
      ) : (
        <p className="mt-4 line-clamp-4 text-[0.95rem] text-muted">{item.summary}</p>
      )}
      <dl className="mt-auto grid grid-cols-2 gap-3 pt-4 text-sm">
        <div>
          <dt className="eyebrow text-glow/90">Where</dt>
          <dd className="font-bold">{whereLabel(item)}</dd>
        </div>
        <div>
          <dt className="eyebrow text-glow/90">Neighbors so far</dt>
          <dd className="font-bold">{Math.round((item.comments.support / total) * 100)}% support</dd>
        </div>
      </dl>
      {live && (
        <Link
          href={`/item/${item.id}`}
          transitionTypes={["nav-forward"]}
          className="-mb-2 mt-2 inline-block self-start py-2 text-sm font-bold text-accent underline underline-offset-4"
        >
          Read the details
        </Link>
      )}
    </article>
  );
}

const SPARKS = Array.from({ length: 24 }, (_, i) => ({
  a: i * 15,
  d: 90 + (i % 4) * 30,
  c: ["#6ff0d8", "#ffc56e", "#ff8f7a", "#c9b8ff"][i % 4],
}));

function Summary() {
  const s = useStore();
  const by = (r: Reaction) => UPCOMING.filter((i) => s.reactions[i.id] === r);
  const support = by("support");
  const oppose = by("oppose");
  const unsure = by("skip");
  const commented = new Set(s.comments.map((c) => c.itemId));

  return (
    <section className="glass-strong halo grabber window-open relative mx-auto mt-10 max-w-2xl rounded-[32px] p-6 text-center sm:p-8">
      <div className="relative mx-auto h-20 w-20" aria-hidden="true">
        {SPARKS.map((p, i) => (
          <span
            key={i}
            className="burst absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full"
            style={{
              ["--a" as string]: `${p.a}deg`,
              ["--dist" as string]: `${p.d}px`,
              background: p.c,
              boxShadow: `0 0 10px ${p.c}`,
            }}
          />
        ))}
        <span className="pop absolute inset-0 flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffd88a,#ff8f8f)] text-4xl shadow-[0_0_50px_rgb(255_197_110/0.6)]">
          🎉
        </span>
      </div>
      <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight">You&apos;ve been through the whole agenda</h2>
      <p className="mt-2 text-muted">Now pick one that matters most and tell the {PLACE.words.council} in your own words.</p>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {(
          [
            ["Support", support.length, "var(--support)"],
            ["Oppose", oppose.length, "var(--oppose)"],
            ["Not sure", unsure.length, "var(--lilac)"],
          ] as const
        ).map(([label, n, color]) => (
          <div key={label} className="rounded-2xl bg-white/5 p-3 ring-1 ring-line">
            <dt className="eyebrow" style={{ color }}>
              {label}
            </dt>
            <dd className="font-display text-3xl font-extrabold">
              <CountUp value={n} duration={900} />
            </dd>
          </div>
        ))}
      </dl>
      <ul className="mt-6 space-y-2 text-left">
        {[...support, ...oppose, ...unsure].map((i, n) => {
          const r = s.reactions[i.id];
          return (
            <li
              key={i.id}
              className="rise flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-line"
              style={{ animationDelay: `${300 + n * 60}ms` }}
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold"
                style={{ color: REACT[r].color, background: `color-mix(in srgb, ${REACT[r].color} 15%, transparent)` }}
              >
                {REACT[r].icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">{REACT[r].label}: </span>
                <span className="line-clamp-1 text-sm font-bold">{i.title}</span>
              </span>
              {commented.has(i.id) ? (
                <span className="shrink-0 text-xs font-bold text-support">✓ Commented</span>
              ) : (
                <Link
                  href={`/item/${i.id}#have-your-say`}
                  className="shrink-0 text-xs font-bold text-accent underline underline-offset-4"
                >
                  Comment
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={clearReactions}
        className="mt-6 text-sm font-bold text-muted underline underline-offset-4 hover:text-ink"
      >
        Start over
      </button>
    </section>
  );
}
