"use client";

import { useState } from "react";
import { CommunityTabs } from "@/components/CommunityTabs";
import { CountUp, useIndicator } from "@/components/Motion";
import { NoticeArt } from "@/components/NoticeArt";
import { Tilt } from "@/components/Tilt";
import { toast } from "@/components/Toast";
import { COMMUNITY, NOTICE_KINDS, NOTICES, type Notice, type NoticeKind } from "@/lib/data";
import { rsvp, useCommunity } from "@/lib/community";
import { daysFromToday, fmt, inDays, parseDate } from "@/lib/util";

const upcoming = NOTICES.filter((n) => daysFromToday(n.date) >= 0).sort((a, b) => (a.date < b.date ? -1 : 1));

export default function NoticeBoardPage() {
  const [kind, setKind] = useState<NoticeKind | "all">("all");
  const alerts = upcoming.filter((n) => n.kind === "alert");
  const events = upcoming.filter((n) => n.kind !== "alert");
  const next = events[0];
  const shown = events.filter((n) => n !== next && (kind === "all" || n.kind === kind));
  const kinds = [...new Set(events.slice(1).map((n) => n.kind))];

  return (
    <div className="py-10">
      <CommunityTabs />
      <header className="mt-8 text-center">
        <p className="eyebrow rise text-accent">From the {COMMUNITY.office}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight [perspective:800px] sm:text-5xl">
          <span className="word">What&apos;s</span>{" "}
          <span className="word" style={{ ["--i" as string]: 1 }}>
            happening
          </span>{" "}
          <span className="word font-serif text-[1.15em] font-normal italic" style={{ ["--i" as string]: 2 }}>
            <span className="text-aurora">around you</span>
          </span>
        </h1>
        <p className="rise mx-auto mt-3 max-w-xl text-muted" style={{ animationDelay: "250ms" }}>
          Festivals, games, town halls, and anything that changes your day, like a water shutoff or a road closure.
          Say you&apos;re coming in one tap so the city can plan buses, staff and space.
        </p>
      </header>

      {alerts.map((a) => (
        <AlertBanner key={a.id} notice={a} />
      ))}

      {next && <UpNext notice={next} />}

      <section aria-labelledby="coming-up" className="mt-14">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="coming-up" className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight">
            Coming up
            <span aria-hidden="true" className="grow-x h-px w-32 bg-gradient-to-r from-accent/70 via-coral/40 to-transparent" />
          </h2>
          <KindFilter kind={kind} kinds={kinds} onChange={setKind} />
        </div>
        <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((n, i) => (
            <li key={n.id} id={`notice-${n.id}`} data-reveal className="flex scroll-mt-28" style={{ ["--d" as string]: `${(i % 3) * 100}ms` }}>
              <NoticeCard notice={n} />
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-5 text-muted">Nothing else of this kind coming up.</p>}
      </section>
    </div>
  );
}

function KindFilter({ kind, kinds, onChange }: { kind: NoticeKind | "all"; kinds: NoticeKind[]; onChange: (k: NoticeKind | "all") => void }) {
  const [ref, pill] = useIndicator<HTMLDivElement, HTMLSpanElement>(kind);
  const options: (NoticeKind | "all")[] = ["all", ...kinds];
  return (
    <div ref={ref} role="group" aria-label="Filter notices" className="glass relative flex gap-1 rounded-full p-1">
      <span
        ref={pill}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-full bg-[linear-gradient(135deg,#f4fffc,#c9f7ee)] opacity-0 transition-[transform,width,opacity] duration-500 ease-spring"
      />
      {options.map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={kind === k}
          data-active={kind === k}
          onClick={() => onChange(k)}
          className={`relative rounded-full px-3 py-2 text-sm font-bold transition-colors duration-300 ${kind === k ? "text-night" : "hover:bg-white/10"}`}
        >
          {k === "all" ? "All" : NOTICE_KINDS[k].label}
        </button>
      ))}
    </div>
  );
}

/** A torn-off calendar page with the date, which swings when you point at the card. */
function DatePage({ date, color, big }: { date: string; color: string; big?: boolean }) {
  const d = parseDate(date);
  return (
    <div className={`swing shrink-0 overflow-hidden rounded-2xl bg-[#f4fffc] text-center shadow-[0_14px_30px_-10px_rgb(0_0_0/0.7)] ${big ? "w-24" : "w-16"}`}>
      <p className="py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#2a1204]" style={{ background: color }}>
        {d.toLocaleDateString("en-US", { month: "short" })}
      </p>
      <p className={`font-display font-extrabold leading-none text-night ${big ? "pt-2 text-5xl" : "pt-1.5 text-3xl"}`}>{d.getDate()}</p>
      <p className={`font-bold uppercase text-night/60 ${big ? "pb-2.5 pt-1 text-xs" : "pb-1.5 text-[0.6rem]"}`}>
        {d.toLocaleDateString("en-US", { weekday: "short" })}
      </p>
    </div>
  );
}

function AlertBanner({ notice }: { notice: Notice }) {
  return (
    <div id={`notice-${notice.id}`} data-reveal role="note" className="glass relative mt-8 scroll-mt-28 overflow-hidden rounded-[28px] ring-1 ring-coral/40">
      <div className="relative flex flex-wrap items-center gap-4 p-4 pl-5 sm:flex-nowrap">
        <div className="absolute inset-0 opacity-70">
          <NoticeArt art={notice.art} emoji="" />
        </div>
        <span className="breathe relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral/20 text-2xl ring-1 ring-coral/50">
          {notice.emoji}
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="eyebrow text-coral">
            Alert · {fmt(notice.date)} ({inDays(daysFromToday(notice.date))})
          </p>
          <p className="font-display text-lg font-extrabold leading-tight">{notice.title}</p>
          <p className="text-sm text-ink/80">{notice.body}</p>
        </div>
      </div>
    </div>
  );
}

function UpNext({ notice }: { notice: Notice }) {
  const color = NOTICE_KINDS[notice.kind].color;
  const days = daysFromToday(notice.date);
  return (
    <section id={`notice-${notice.id}`} aria-labelledby="up-next" className="mt-8 scroll-mt-28">
      <Tilt max={3} className="rounded-[36px]">
        <article data-reveal className="glass-strong halo grabber group grid grid-cols-1 overflow-hidden rounded-[36px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative min-h-60 md:min-h-full">
            <NoticeArt art={notice.art} emoji={notice.emoji} big />
          </div>
          <div className="relative p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <DatePage date={notice.date} color={color} big />
              <div>
                <p className="eyebrow" style={{ color }}>
                  Up next · {days === 0 ? "today" : days === 1 ? "tomorrow" : <>in <CountUp value={days} /> days</>}
                </p>
                <h2 id="up-next" className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
                  {notice.title}
                </h2>
                <p className="mt-1 text-sm font-bold text-muted">
                  {notice.time} · {notice.venue}
                </p>
              </div>
            </div>
            <p className="mt-5 text-[1.02rem] leading-relaxed">{notice.body}</p>
            {notice.details && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {notice.details.map((d, i) => (
                  <li key={d} className="rise flex gap-2" style={{ animationDelay: `${400 + i * 90}ms` }}>
                    <span aria-hidden="true" style={{ color }}>
                      ✦
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6">
              <Rsvp notice={notice} />
            </div>
          </div>
        </article>
      </Tilt>
    </section>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const color = NOTICE_KINDS[notice.kind].color;
  return (
    <Tilt max={4} className="h-full w-full rounded-[28px]">
      <article className="glass group flex h-full flex-col overflow-hidden rounded-[28px]">
        <div className="relative h-36">
          <NoticeArt art={notice.art} emoji={notice.emoji} />
          <div className="absolute left-4 top-4">
            <DatePage date={notice.date} color={color} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="eyebrow" style={{ color }}>
            {NOTICE_KINDS[notice.kind].label} · {inDays(daysFromToday(notice.date))}
          </p>
          <h3 className="mt-1 font-display text-xl font-extrabold leading-tight">{notice.title}</h3>
          <p className="mt-1 text-sm font-bold text-muted">
            {notice.time} · {notice.venue}
          </p>
          <p className="mt-3 line-clamp-3 text-sm">{notice.body}</p>
          <div className="mt-auto pt-5">
            <Rsvp notice={notice} compact />
          </div>
        </div>
      </article>
    </Tilt>
  );
}

const FACES = ["AK", "SR", "MJ", "PN", "TV"];
const FACE_COLORS = ["#6ff0d8", "#ffc56e", "#ff8f7a", "#c9b8ff", "#a3e9a0"];

/** "I'm going", then how many are coming with you, and who else is. */
function Rsvp({ notice, compact }: { notice: Notice; compact?: boolean }) {
  const c = useCommunity();
  const people = c.rsvps[notice.id]?.mine ?? 0;
  // Everyone's RSVPs, from the server once it answers.
  const total = c.rsvps[notice.id]?.total ?? notice.going;
  const set = (n: number) => rsvp(notice.id, n).catch((e) => toast(e.message, "⚠️"));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {people ? (
        <div className="pop flex items-center gap-1 rounded-full bg-support-solid/30 p-1 ring-1 ring-support/50">
          <button
            type="button"
            aria-label="One fewer person"
            onClick={() => set(people - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full font-bold transition hover:bg-white/10 active:scale-90"
          >
            −
          </button>
          <span className="min-w-[5.5rem] text-center text-sm font-bold" aria-live="polite">
            ✓ {people} {people === 1 ? "person" : "people"}
          </span>
          <button
            type="button"
            aria-label="One more person"
            onClick={() => set(Math.min(10, people + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full font-bold transition hover:bg-white/10 active:scale-90"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={c.status === "loading"}
          onClick={() =>
            rsvp(notice.id, 1)
              .then(() => toast(`You're going to ${notice.title.split(" ").slice(0, 4).join(" ")}…`, notice.emoji))
              .catch((e) => toast(e.message, "⚠️"))
          }
          className={`btn-ember rounded-full font-bold disabled:opacity-60 ${compact ? "px-4 py-2 text-sm" : "px-6 py-3"}`}
        >
          I&apos;m going
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          downloadIcs(notice);
          toast("Added to your calendar", "📅");
        }}
        className="glass rounded-full px-3.5 py-2 text-sm font-bold transition hover:bg-white/10 active:scale-95"
      >
        <span aria-hidden="true">📅</span> Calendar
      </button>
      <span className="flex items-center gap-2 text-xs font-bold text-muted">
        <span className="flex -space-x-1.5" aria-hidden="true">
          {FACES.slice(0, compact ? 3 : 5).map((f, i) => (
            <span
              key={f}
              className="dot-pop flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] font-extrabold text-night ring-2 ring-night"
              style={{ background: FACE_COLORS[i], ["--i" as string]: i }}
            >
              {f}
            </span>
          ))}
        </span>
        <span>
          <CountUp value={total} duration={900} /> going
        </span>
      </span>
    </div>
  );
}

/** Builds a calendar file for the event and downloads it. */
function downloadIcs(n: Notice) {
  const [, h, m, ap] = n.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/) ?? [];
  const hour = h ? (Number(h) % 12) + (ap === "PM" ? 12 : 0) : 9;
  const start = `${n.date.replaceAll("-", "")}T${String(hour).padStart(2, "0")}${m ?? "00"}00`;
  const esc = (t: string) => t.replace(/[,;\\]/g, (c) => `\\${c}`);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ayeline//Notice board//EN",
    "BEGIN:VEVENT",
    `UID:${n.id}@ayeline`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${start}`,
    `SUMMARY:${esc(n.title)}`,
    `LOCATION:${esc(n.venue)}`,
    `DESCRIPTION:${esc(n.body)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${n.id}.ics` });
  a.click();
  URL.revokeObjectURL(url);
}

