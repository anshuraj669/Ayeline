"use client";

import { useState } from "react";
import { CITY, NEIGHBORHOODS, PERSONAS, type Neighborhood, type Persona } from "@/lib/data";
import { saveProfile } from "@/lib/store";

export function Onboarding({
  initial,
  onDone,
}: {
  initial?: { personas: Persona[]; neighborhood: Neighborhood | null };
  onDone?: () => void;
}) {
  const [personas, setPersonas] = useState<Persona[]>(initial?.personas ?? []);
  const [hood, setHood] = useState<Neighborhood | null>(initial?.neighborhood ?? null);

  const toggle = (p: Persona) => setPersonas((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const chip = (selected: boolean) =>
    `chip-pop inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-bold transition-[background-color,border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 ${
      selected
        ? "border-glow bg-[linear-gradient(135deg,#0e7c74,#0b5d63)] text-white shadow-[0_0_22px_-4px_rgb(111_240_216/0.8)]"
        : "border-line bg-white/5 hover:border-glow/60 hover:bg-white/10"
    }`;
  const stagger = (i: number) => ({ animationDelay: `${150 + i * 40}ms` });

  return (
    <section aria-labelledby="onboard-title" className="glass-strong halo grabber rise rounded-[32px] p-6 sm:p-8">
      <p className="eyebrow text-accent">Make this feed yours · 15 seconds</p>
      <h2 id="onboard-title" className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        Who are you in <span className="font-serif text-[1.15em] font-normal italic text-glow">{CITY}?</span>
      </h2>
      <p className="mt-1 text-muted">Pick all that fit. We&apos;ll put what affects you first. This stays on your device.</p>

      <fieldset className="mt-5">
        <legend className="sr-only">About you</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERSONAS) as Persona[]).map((p, i) => (
            <span key={p} className="rise inline-flex" style={stagger(i)}>
              <button type="button" aria-pressed={personas.includes(p)} onClick={() => toggle(p)} className={chip(personas.includes(p))}>
                <span aria-hidden="true">{PERSONAS[p].emoji}</span>
                {PERSONAS[p].label}
              </button>
            </span>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 font-bold">Where do you live?</legend>
        <div className="flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n, i) => (
            <span key={n} className="rise inline-flex" style={stagger(i + 9)}>
              <button type="button" aria-pressed={hood === n} onClick={() => setHood(hood === n ? null : n)} className={chip(hood === n)}>
                📍 {n}
              </button>
            </span>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            saveProfile(personas, hood);
            onDone?.();
          }}
          className="btn-ember rounded-full px-6 py-3 font-bold"
        >
          {personas.length || hood ? "Show what affects me →" : "Show me everything →"}
        </button>
        {onDone && initial && (
          <button type="button" onClick={onDone} className="font-bold text-muted underline underline-offset-4">
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
