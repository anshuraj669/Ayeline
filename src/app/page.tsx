"use client";

import Link from "next/link";
import { Fragment, useState, ViewTransition } from "react";
import { CityMap } from "@/components/CityMap";
import { openPalette } from "@/components/CommandPalette";
import { ItemCard } from "@/components/ItemCard";
import { Magnetic } from "@/components/Magnetic";
import { CountUp, useIndicator } from "@/components/Motion";
import { Onboarding } from "@/components/Onboarding";
import { Tilt } from "@/components/Tilt";
import { TopicTag } from "@/components/TopicTag";
import { VoteResult } from "@/components/VoteResult";
import { COUNCIL_SIZE, ITEMS, MEETINGS, NEIGHBORHOODS, PERSONAS, PLACE, TOPICS, meetingFor, type Meeting, type Topic } from "@/lib/data";
import { setCouncilLanguage, useHydrated, useStore } from "@/lib/store";
import { daysFromToday, fmt, inDays, isRelevant, relevance } from "@/lib/util";

export default function FeedPage() {
  const s = useStore();
  const hydrated = useHydrated();
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [editing, setEditing] = useState(false);

  const nextMeeting = MEETINGS.filter((m) => daysFromToday(m.date) >= 0).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const upcoming = ITEMS.filter((i) => i.status === "upcoming")
    .filter((i) => topic === "all" || i.topic === topic)
    .sort((a, b) => (meetingFor(a).date < meetingFor(b).date ? -1 : 1));
  const decided = ITEMS.filter((i) => i.status !== "upcoming");

  const forYou = upcoming.filter((i) => isRelevant(relevance(i, s)));
  const rest = upcoming.filter((i) => !isRelevant(relevance(i, s)));
  const personalized = s.onboarded && (s.personas.length > 0 || s.neighborhood !== null);
  const topicsInUse = [...new Set(ITEMS.filter((i) => i.status === "upcoming").map((i) => i.topic))];

  return (
    <>
      <section className="py-10 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="rise mb-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-sm font-bold text-muted ring-1 ring-line backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-support opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-support" />
              </span>
              {ITEMS.filter((i) => i.status === "upcoming").length} items on the agenda · {PLACE.body}
            </p>
            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight [perspective:800px] sm:text-6xl">
              <Words text={PLACE.hero.headline} />
              <span className="word mt-2 block pb-1 font-serif text-[1.12em] font-normal italic leading-none tracking-normal" style={{ ["--i" as string]: PLACE.hero.headline.split(" ").length }}>
                <span className="text-aurora">{PLACE.hero.accent}</span>
              </span>
            </h1>
            <p className="rise mt-6 max-w-2xl text-lg text-muted" style={{ animationDelay: "900ms" }}>
              {PLACE.hero.intro}
            </p>
            <div className="rise mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "1000ms" }}>
              <Magnetic>
                <Link href="/swipe" className="btn-ember inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-bold">
                  <span aria-hidden="true">🃏</span> Quick take: swipe the agenda
                </Link>
              </Magnetic>
              <Magnetic strength={0.2}>
                <button
                  type="button"
                  onClick={openPalette}
                  className="glass inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 font-bold transition hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-glow" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  Search the agenda
                  <kbd className="rounded-md bg-white/10 px-1.5 text-xs text-muted ring-1 ring-line">⌘K</kbd>
                </button>
              </Magnetic>
            </div>
          </div>
          {nextMeeting && <MeetingBeacon meeting={nextMeeting} />}
        </div>
        <Ticker />
        <Stats />
        <a href="#feed" className="mx-auto mt-10 flex w-fit flex-col items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted hover:text-ink">
          Scroll the agenda
          <span aria-hidden="true" className="flex h-9 w-6 justify-center rounded-full border-2 border-line pt-1.5">
            <span className="scroll-cue h-2 w-1 rounded-full bg-glow" />
          </span>
        </a>
      </section>

      {hydrated && (!s.onboarded || editing) && (
        <div className="mb-10">
          <Onboarding
            initial={editing ? { personas: s.personas, neighborhood: s.neighborhood } : undefined}
            onDone={editing ? () => setEditing(false) : undefined}
          />
        </div>
      )}

      <div id="feed" className="z-30 mb-8 scroll-mt-28 md:sticky md:top-[5.5rem]">
        <div className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-[28px] p-2">
          <TopicFilter topic={topic} topics={topicsInUse} onChange={setTopic} />
          <label className="flex cursor-pointer items-center gap-3 rounded-full bg-white/5 py-1 pl-4 pr-1 ring-1 ring-line">
            <span className="text-sm font-bold">
              Show {PLACE.words.officialLanguage}
              <span className="sr-only"> instead of plain language</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={s.councilLanguage}
              onChange={(e) => setCouncilLanguage(e.target.checked)}
            />
            <span
              aria-hidden="true"
              className="relative h-7 w-12 rounded-full bg-white/15 transition duration-300 peer-checked:bg-navy peer-checked:shadow-[0_0_18px_rgb(111_240_216/0.7)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:duration-500 after:ease-spring peer-active:after:w-6 peer-checked:after:translate-x-5 peer-checked:peer-active:after:translate-x-4"
            />
          </label>
        </div>
      </div>

      {s.councilLanguage && (
        <p role="status" className="flip-in mb-6 rounded-2xl border border-dashed border-glow/40 bg-navy-soft p-4 text-sm backdrop-blur">
          <strong>This is how {PLACE.words.author} actually writes its agenda.</strong> Most residents never read past the first line.
          Turn the switch off to see it in plain language.
        </p>
      )}

      {hydrated && personalized && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Personalized for:</span>
          {s.personas.map((p) => (
            <span key={p} className="pop rounded-full bg-white/5 px-2.5 py-0.5 font-bold text-ink ring-1 ring-line">
              {PERSONAS[p].emoji} {PERSONAS[p].who}
            </span>
          ))}
          {s.neighborhood && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-bold text-ink ring-1 ring-line">📍 {s.neighborhood}</span>
          )}
          <button type="button" onClick={() => setEditing(true)} className="-my-2 px-2 py-2 font-bold text-accent underline underline-offset-4">
            Edit
          </button>
        </div>
      )}

      {personalized ? (
        <>
          <FeedSection
            id="for-you"
            title="Affects you"
            subtitle={forYou.length ? `${forYou.length} item${forYou.length > 1 ? "s" : ""} touch your life directly.` : "Nothing in this topic affects you directly."}
            items={forYou}
          />
          {rest.length > 0 && <FeedSection id="also" title="Also on the agenda" items={rest} />}
        </>
      ) : (
        <FeedSection id="all-items" title="On the agenda" items={upcoming} />
      )}

      <CityMap />

      <section aria-labelledby="decided" className="mt-16">
        <SectionTitle id="decided" title="Recently decided" subtitle={`What the ${PLACE.words.council} voted on at its last meeting.`} />
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {decided.map((i, n) => (
            <li key={i.id} data-reveal style={{ ["--d" as string]: `${n * 90}ms` }}>
              <Tilt max={4} className="h-full rounded-[28px]">
              <Link
                href={`/item/${i.id}`}
                transitionTypes={["nav-forward"]}
                className="glass flex h-full flex-col items-start gap-3 rounded-[28px] p-5 transition hover:bg-white/[0.06]"
              >
                <ViewTransition name={`item-topic-${i.id}`} share="morph" default="none">
                  <TopicTag topic={i.topic} />
                </ViewTransition>
                <ViewTransition name={`item-title-${i.id}`} share="morph" default="none">
                  <span className="font-display text-lg font-bold leading-tight">{i.title}</span>
                </ViewTransition>
                <span className="mt-auto">
                  <VoteResult yes={i.result!.yes} no={i.result!.no} passed={i.status === "passed"} />
                </span>
              </Link>
              </Tilt>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function FeedSection({ id, title, subtitle, items }: { id: string; title: string; subtitle?: string; items: typeof ITEMS }) {
  return (
    <section aria-labelledby={id} className="mb-12">
      <SectionTitle id={id} title={title} subtitle={subtitle} />
      {items.length > 0 && (
        <ul className="mt-5 grid gap-5 md:grid-cols-2">
          {items.map((item, i) => (
            <li key={item.id} data-reveal className="flex" style={{ ["--d" as string]: `${(i % 2) * 110}ms` }}>
              <div className="flex w-full">
                <ItemCard item={item} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SectionTitle({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div data-reveal>
      <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight">
        {title}
        <span aria-hidden="true" className="grow-x h-px max-w-40 flex-1 bg-gradient-to-r from-glow/70 via-accent/40 to-transparent" />
      </h2>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </div>
  );
}

/** Splits a headline into words that lift into place one after another. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className="word" style={{ ["--i" as string]: i }}>
            {w}
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

/** The agenda in four numbers. */
function Stats() {
  const upcoming = ITEMS.filter((i) => i.status === "upcoming");
  const comments = upcoming.reduce((n, i) => n + i.comments.support + i.comments.oppose, 0);
  const stats: [number, string, string][] = [
    [upcoming.length, "decisions coming up", "var(--glow)"],
    [comments, "comments from neighbors", "var(--accent)"],
    [NEIGHBORHOODS.length, "neighborhoods affected", "var(--coral)"],
    [COUNCIL_SIZE, `${PLACE.words.members} to convince`, "var(--lilac)"],
  ];
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(([n, label, color], i) => (
        <li key={label}>
          <Tilt max={8} className="rounded-[24px]">
            <div
              data-reveal
              className="glass group relative overflow-hidden rounded-[24px] p-4 sm:p-5"
              style={{ ["--d" as string]: `${i * 90}ms` }}
            >
              <span
                aria-hidden="true"
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                style={{ background: color }}
              />
              <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color }}>
                <CountUp value={n} duration={1600} />
              </p>
              <p className="mt-1 text-xs font-bold text-muted sm:text-sm">{label}</p>
            </div>
          </Tilt>
        </li>
      ))}
    </ul>
  );
}

/** A news-style ticker of what's on the agenda. Decorative: every item is also in the feed below. */
function Ticker() {
  const list = ITEMS.filter((i) => i.status === "upcoming");
  const row = (
    <span className="flex shrink-0 items-center">
      {list.map((i) => (
        <span key={i.id} className="flex items-center gap-2 px-6 text-sm">
          <span>{TOPICS[i.topic].emoji}</span>
          <span className="font-bold" style={{ color: TOPICS[i.topic].color }}>
            {i.number}
          </span>
          <span className="text-ink/85">{i.title}</span>
          <span className="pl-6 text-accent/60">✦</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      aria-hidden="true"
      className="marquee-host glass rise mt-12 flex overflow-hidden rounded-full py-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      style={{ animationDelay: "1100ms" }}
    >
      <div className="marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

function TopicFilter({ topic, topics, onChange }: { topic: Topic | "all"; topics: Topic[]; onChange: (t: Topic | "all") => void }) {
  const [ref, pill] = useIndicator<HTMLDivElement, HTMLSpanElement>(topic);
  const chip = (value: Topic | "all", label: React.ReactNode) => (
    <button
      key={value}
      type="button"
      aria-pressed={topic === value}
      data-active={topic === value}
      onClick={() => onChange(value)}
      className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors duration-300 ${
        topic === value ? "text-night" : "text-ink hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div ref={ref} role="group" aria-label="Filter by topic" className="relative flex min-w-0 max-w-full gap-1.5 overflow-x-auto [scrollbar-width:none]">
      <span
        ref={pill}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-full bg-[linear-gradient(135deg,#f4fffc,#c9f7ee)] opacity-0 shadow-[0_0_20px_-4px_rgb(111_240_216/0.7)] transition-[transform,width,opacity] duration-500 ease-spring"
      />
      {chip("all", "All")}
      {topics.map((t) =>
        chip(
          t,
          <>
            <span aria-hidden="true">{TOPICS[t].emoji}</span> {TOPICS[t].label}
          </>,
        ),
      )}
    </div>
  );
}

/** The next meeting, as a glowing countdown: the ring empties as the comment window closes. */
function MeetingBeacon({ meeting }: { meeting: Meeting }) {
  const days = daysFromToday(meeting.date);
  const commentDays = daysFromToday(meeting.commentDeadline);
  const WINDOW = 14;
  const r = 52;
  const c = 2 * Math.PI * r;
  const left = Math.max(0, Math.min(1, days / WINDOW));

  return (
    <div className="rise relative" style={{ animationDelay: "300ms" }}>
      <Tilt max={6} className="rounded-[32px]">
        <div className="glass-strong halo grabber rounded-[32px] p-6">
          <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-5">
            <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <span aria-hidden="true" className="ripple absolute inset-2 rounded-full border border-glow/40" />
              <span aria-hidden="true" className="ripple absolute inset-2 rounded-full border border-accent/30" style={{ animationDelay: "1.6s" }} />
              <svg viewBox="0 0 120 120" className="relative h-full w-full -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="beacon" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6ff0d8" />
                    <stop offset="55%" stopColor="#ffc56e" />
                    <stop offset="100%" stopColor="#ff8f7a" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="8" />
                <circle cx="60" cy="60" r={r - 9} fill="none" stroke="rgb(111 240 216 / 0.18)" strokeWidth="1" strokeDasharray="1 5" />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke="url(#beacon)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - left)}
                  className="ring-draw"
                  style={{ ["--c" as string]: c, filter: "drop-shadow(0 0 6px rgb(255 197 110 / 0.7))" }}
                />
                <g className="orbit">
                  <circle cx="60" cy={60 - r} r="3" fill="#fff" style={{ filter: "drop-shadow(0 0 6px #6ff0d8)" }} />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-extrabold leading-none">
                  <CountUp value={days} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">days</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-glow">Next {PLACE.words.meeting}</p>
              <p className="mt-1 font-display text-2xl font-bold leading-tight">
                {fmt(meeting.date, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-muted">{meeting.time} · {PLACE.venue}</p>
            </div>
          </div>
          <p className="breathe mt-5 flex items-start gap-2 rounded-2xl bg-accent-soft p-3.5 text-sm ring-1 ring-accent/25">
            <span aria-hidden="true">✍️</span>
            <span>
              Written comments close <strong className="text-accent">{fmt(meeting.commentDeadline)} at noon</strong> ({inDays(commentDays)}).
            </span>
          </p>
        </div>
      </Tilt>
    </div>
  );
}
