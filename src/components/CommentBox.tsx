"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { COUNCIL_SIZE, NEIGHBORHOODS, PERSONAS, PLACE, meetingFor, type AgendaItem } from "@/lib/data";
import { addComment, useStore, type Stance } from "@/lib/store";
import { cap, fmt, relevance } from "@/lib/util";

const STANCES: { value: Stance; label: string; emoji: string; className: string }[] = [
  { value: "support", label: "I support it", emoji: "👍", className: "border-support bg-support-solid text-white shadow-[0_0_24px_-6px_rgb(134_239_172/0.8)]" },
  { value: "oppose", label: "I oppose it", emoji: "👎", className: "border-oppose bg-oppose-solid text-white shadow-[0_0_24px_-6px_rgb(255_143_122/0.8)]" },
  { value: "question", label: "I have a concern", emoji: "🤔", className: "border-question bg-question-solid text-white shadow-[0_0_24px_-6px_rgb(201_184_255/0.8)]" },
];

const STARTERS: Record<Stance, string[]> = {
  support: ["This matters to me because ", "I've seen this work when ", "Please vote yes because "],
  oppose: ["I'm worried that ", "A better option would be ", "Please vote no because "],
  question: ["Before you vote, please explain ", "I'd support this if ", "How will this affect "],
};

const MAX = 1000;

// Sparks thrown out when a comment lands.
const BURST = Array.from({ length: 16 }, (_, i) => ({
  a: i * 22.5,
  d: 44 + (i % 3) * 16,
  c: ["#6ff0d8", "#ffc56e", "#ff8f7a", "#c9b8ff"][i % 4],
}));

export function CommentBox({ item }: { item: AgendaItem }) {
  const s = useStore();
  const meeting = meetingFor(item);
  const existing = s.comments.find((c) => c.itemId === item.id);
  const [stance, setStance] = useState<Stance | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [hood, setHood] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const cursorToEnd = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const ids = { text: useId(), name: useId(), hood: useId() };

  const r = relevance(item, s);
  const where = s.neighborhood ? ` in ${s.neighborhood}` : "";
  const intro = r.personas[0]
    ? `As ${PERSONAS[r.personas[0]].who}${where}, `
    : s.neighborhood
      ? `As a resident of ${s.neighborhood}, `
      : "";

  // After a starter is inserted, put the caret at the end before the next keystroke is handled.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (cursorToEnd.current && el) {
      cursorToEnd.current = false;
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [text]);

  useEffect(() => {
    if (existing && !editing) doneRef.current?.focus();
  }, [existing, editing]);

  if (existing && !editing) {
    const total = item.comments.support + item.comments.oppose + 1;
    return (
      <div ref={doneRef} tabIndex={-1} className="glass-strong halo grabber window-open rounded-[28px] p-6 focus:outline-none" role="status">
        <div className="relative h-14 w-14" aria-hidden="true">
          {BURST.map((b, i) => (
            <span
              key={i}
              className="burst absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full"
              style={{ ["--a" as string]: `${b.a}deg`, ["--dist" as string]: `${b.d}px`, background: b.c, boxShadow: `0 0 10px ${b.c}` }}
            />
          ))}
          <span className="pop absolute inset-0 flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#22c55e,#0e7c74)] shadow-[0_0_40px_rgb(134_239_172/0.7)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="draw" d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Your voice is on the record</h2>
        <p className="mt-2">
          Your comment goes to all {COUNCIL_SIZE} {PLACE.words.members} before the vote on{" "}
          <strong>{fmt(meeting.date, { weekday: "long", month: "long", day: "numeric" })}</strong>. You&apos;re one of{" "}
          <strong>{total} neighbors</strong> who weighed in.
        </p>
        <blockquote className="mt-4 rounded-2xl bg-bg p-4 text-sm ring-1 ring-line">
          <p className="font-bold">{STANCES.find((x) => x.value === existing.stance)!.emoji} {STANCES.find((x) => x.value === existing.stance)!.label}</p>
          <p className="mt-1 whitespace-pre-wrap text-muted">{existing.text}</p>
          {existing.name && <p className="mt-2 text-xs font-bold">— {existing.name}</p>}
        </blockquote>
        <p className="mt-4 text-sm">📬 We&apos;ll show you how the {PLACE.words.council} voted in <strong>My voice</strong>.</p>
        <details className="mt-4 rounded-xl border border-line p-4 text-sm">
          <summary className="cursor-pointer font-bold">Want to speak at the meeting in person?</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            {PLACE.inPerson.map((step) => (
              <li key={step}>{step.replace("{place}", meeting.place.split(" · ")[0]).replace("{item}", item.number)}</li>
            ))}
          </ol>
        </details>
        <button
          type="button"
          onClick={() => {
            setStance(existing.stance);
            setText(existing.text);
            setName(existing.name);
            setEditing(true);
          }}
          className="mt-4 text-sm font-bold text-accent underline underline-offset-4"
        >
          Edit my comment
        </button>
      </div>
    );
  }

  function insert(starter: string) {
    const prefix = text ? text.trimEnd() + " " : intro;
    // Mid-sentence after "As a renter, ..." the starter continues the sentence, so lowercase it.
    const piece = prefix.endsWith(", ") ? starter[0].toLowerCase() + starter.slice(1) : starter;
    const next = (prefix + piece).slice(0, MAX);
    cursorToEnd.current = true;
    setText(next);
    // Move focus straight away so the next keystroke (including Space) lands in the textarea, not on the chip.
    textRef.current?.focus();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stance || text.trim().length < 10 || sending) return;
    const comment = { itemId: item.id, stance, text: text.trim(), name: name.trim(), sentAt: new Date().toISOString() };
    const commit = () => {
      addComment(comment);
      setEditing(false);
      setSending(false);
    };
    // Let the card fly off toward City Hall before the confirmation appears.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return commit();
    setSending(true);
    setTimeout(commit, 560);
  }

  return (
    <form onSubmit={submit} className={`glass-strong grabber rounded-[28px] p-6 ${sending ? "send-away" : ""}`}>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">Have your say</h2>
      <p className="mt-1 text-sm text-muted">
        Takes about a minute. {cap(PLACE.words.members)} read every comment before they vote. Comments close{" "}
        <strong className="text-ink">{fmt(meeting.commentDeadline)} at noon</strong>.
      </p>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-bold">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-night">1</span>
          Where do you stand?
        </legend>
        <div className="grid gap-2">
          {STANCES.map((st) => (
            <button
              key={st.value}
              type="button"
              aria-pressed={stance === st.value}
              onClick={() => {
                setStance(st.value);
                if (!text) setText(intro);
              }}
              className={`chip-pop group flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-bold transition duration-300 hover:translate-x-1 ${
                stance === st.value ? st.className : "border-line bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
              }`}
            >
              <span aria-hidden="true" className="text-xl transition-transform duration-500 ease-spring group-hover:scale-125 group-hover:-rotate-12">{st.emoji}</span>
              {st.label}
            </button>
          ))}
        </div>
      </fieldset>

      {stance && (
        <div className="rise mt-6">
          <label htmlFor={ids.text} className="mb-2 block text-sm font-bold">
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-night">2</span>
            Tell them why, in your own words
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Sentence starters">
            {STARTERS[stance].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => insert(st)}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-glow active:scale-95"
              >
                + {st.trim()}…
              </button>
            ))}
          </div>
          <textarea
            ref={textRef}
            id={ids.text}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            rows={6}
            aria-describedby={`${ids.text}-count`}
            className="w-full rounded-2xl border border-line bg-bg p-3 text-[0.95rem] transition-shadow duration-300 placeholder:text-muted/70 focus:border-glow focus:shadow-[0_0_0_4px_rgb(111_240_216/0.12),0_0_30px_-8px_rgb(111_240_216/0.5)] focus:outline-none"
            placeholder="Personal stories are the most persuasive. How would this change your day?"
          />
          <div className="mt-1.5 flex items-center gap-3">
            <span aria-hidden="true" className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-glow via-accent to-coral transition-[width] duration-500 ease-spatial"
                style={{ width: `${Math.min(100, (text.length / 280) * 100)}%` }}
              />
            </span>
            <p id={`${ids.text}-count`} className="text-right text-xs text-muted">
              {text.length}/{MAX}
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.name} className="mb-1 block text-sm font-bold">
                Your name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={ids.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-line bg-bg px-3 focus:border-glow focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor={ids.hood} className="mb-1 block text-sm font-bold">
                Neighborhood
              </label>
              <select
                id={ids.hood}
                value={hood || s.neighborhood || ""}
                onChange={(e) => setHood(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-bg px-3 focus:border-glow focus:outline-none"
              >
                <option value="">Prefer not to say</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Public comments become part of the public record.</p>

          <button
            type="submit"
            disabled={text.trim().length < 10 || text.trim() === intro.trim()}
            className="btn-ember mt-4 w-full rounded-full px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:transform-none"
          >
            {PLACE.sendLabel} <span aria-hidden="true">✦</span>
          </button>
          <p className="mt-2 text-center text-xs text-muted">Prototype: comments are saved on this device only.</p>
        </div>
      )}
    </form>
  );
}
