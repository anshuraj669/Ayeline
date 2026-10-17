"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, ViewTransition } from "react";
import { Chamber } from "@/components/Chamber";
import { CommentBox } from "@/components/CommentBox";
import { Sentiment } from "@/components/Sentiment";
import { toast } from "@/components/Toast";
import { TopicTag } from "@/components/TopicTag";
import { VoteResult } from "@/components/VoteResult";
import { ITEMS, PERSONAS, PLACE, meetingFor, type Persona } from "@/lib/data";
import { toggleFollow, useHydrated, useStore } from "@/lib/store";
import { cap, daysFromToday, fmt, inDays, relevance, whereLabel } from "@/lib/util";

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const item = ITEMS.find((i) => i.id === id);
  const s = useStore();
  const hydrated = useHydrated();
  const [showOfficial, setShowOfficial] = useState(false);

  if (!item) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold">We couldn&apos;t find that agenda item</h1>
        <Link href="/" className="btn-ember mt-6 inline-block rounded-full px-6 py-3 font-bold">
          Back to the agenda
        </Link>
      </div>
    );
  }

  const meeting = meetingFor(item);
  const days = daysFromToday(meeting.date);
  const r = relevance(item, s);
  const following = s.following.includes(item.id);
  const decided = item.status !== "upcoming";
  const yours = r.personas;
  const others = (Object.keys(item.forYou) as Persona[]).filter((p) => !yours.includes(p));

  return (
    <article className="py-8">
      <Link href="/" transitionTypes={["nav-back"]} className="group glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-muted transition hover:text-ink">
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Agenda
      </Link>

      <header className="rise mt-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <ViewTransition name={`item-topic-${item.id}`} share="morph" default="none">
            <TopicTag topic={item.topic} />
          </ViewTransition>
          <span className="font-bold">{item.number}</span>
          <span aria-hidden="true">·</span>
          <span>
            {meeting.title}, {fmt(meeting.date, { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        {/* Arriving from a card, the card's title morphs into this heading. */}
        <ViewTransition name={`item-title-${item.id}`} share="morph" default="none">
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[2.6rem]">{item.title}</h1>
        </ViewTransition>

        <div className="mt-5 rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] backdrop-blur transition-colors hover:border-glow/40">
          <button
            type="button"
            onClick={() => setShowOfficial((v) => !v)}
            aria-expanded={showOfficial}
            aria-controls="official-wording"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold"
          >
            <span>
              <span aria-hidden="true">📜</span> {showOfficial ? "Hide" : "See"} how {PLACE.words.author} wrote it
            </span>
            <span aria-hidden="true" className={`transition-transform duration-500 ease-spring ${showOfficial ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {showOfficial && (
            <div id="official-wording" className="flip-in border-t border-dashed border-line px-4 pb-4 pt-3">
              <p className="official text-lg font-bold leading-snug">{item.officialTitle}</p>
              <p className="official mt-3 text-[0.95rem] leading-relaxed text-ink/80">{item.officialText}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              toggleFollow(item.id);
              toast(following ? "Stopped following" : "Following. We'll show you the vote result", following ? "🔕" : "🔖");
            }}
            aria-pressed={following}
            className={`chip-pop inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95 ${
              following ? "border-glow bg-navy text-white shadow-[0_0_18px_-2px_rgb(111_240_216/0.8)]" : "border-line bg-white/5 hover:border-glow"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill={following ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
              <path d="M6 3h12v18l-6-4-6 4z" strokeLinejoin="round" />
            </svg>
            {following ? "Following" : "Follow"}
          </button>
          <ShareButton title={item.title} />
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Key facts" className="grid gap-3 sm:grid-cols-3">
            <Fact i={0} label={decided ? "Voted" : `${cap(PLACE.words.council)} votes`}>
              {fmt(meeting.date)}
              <span className={`block text-sm ${!decided && days <= 7 ? "text-accent" : "text-muted"}`}>
                {decided ? inDays(days) : `${meeting.time} · ${inDays(days)}`}
              </span>
            </Fact>
            <Fact i={1} label="Cost">{item.cost}</Fact>
            <Fact i={2} label="Where">{whereLabel(item)}</Fact>
          </section>

          {hydrated && (yours.length > 0 || r.nearYou) && (
            <section aria-labelledby="for-you" data-reveal className="glass-strong halo rounded-[28px] p-6">
              <h2 id="for-you" className="font-display text-xl font-extrabold tracking-tight">
                What this means for you
              </h2>
              <ul className="mt-3 space-y-3">
                {r.nearYou && yours.length === 0 && (
                  <li className="flex gap-3">
                    <span aria-hidden="true" className="text-xl">📍</span>
                    <span>This is happening in {s.neighborhood}, where you live.</span>
                  </li>
                )}
                {yours.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="text-xl">{PERSONAS[p].emoji}</span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                        Because {PERSONAS[p].label.replace(/^I'm/, "you're").replace(/^I /, "you ")}
                      </span>
                      {item.forYou[p]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="plain" data-reveal className="glass rounded-[28px] p-6">
            <h2 id="plain" className="font-display text-xl font-extrabold tracking-tight">
              In plain words
            </h2>
            <p className="mt-2 text-lg leading-relaxed">{item.summary}</p>
            {others.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted">
                  {yours.length ? "Who else it affects" : "Who it affects"}
                </h3>
                <ul className="mt-2 space-y-2">
                  {others.map((p) => (
                    <li key={p} className="flex gap-3 text-[0.95rem]">
                      <span aria-hidden="true">{PERSONAS[p].emoji}</span>
                      <span>
                        <strong>{PERSONAS[p].who[0].toUpperCase() + PERSONAS[p].who.slice(1)}:</strong> {item.forYou[p]}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="debate" className="grid gap-3 sm:grid-cols-2">
            <h2 id="debate" className="sr-only">
              Arguments for and against
            </h2>
            <div data-reveal className="glass rounded-[28px] border-t-support/40 p-5 shadow-[inset_0_2px_0_rgb(134_239_172/0.35)]">
              <h3 className="font-bold text-support">👍 Why some support it</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem]">
                {item.argumentsFor.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div data-reveal className="glass rounded-[28px] border-t-oppose/40 p-5 shadow-[inset_0_2px_0_rgb(255_143_122/0.35)]" style={{ ["--d" as string]: "120ms" }}>
              <h3 className="font-bold text-oppose">👎 Why some oppose it</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem]">
                {item.argumentsAgainst.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="timeline" data-reveal className="glass rounded-[28px] p-6">
            <h2 id="timeline" className="font-display text-xl font-extrabold tracking-tight">
              Where it is now
            </h2>
            <ol className="mt-4">
              {item.timeline.map((t, i) => {
                const past = daysFromToday(t.date) < 0;
                const isNow = !past && (i === 0 || daysFromToday(item.timeline[i - 1].date) < 0);
                return (
                  <li key={t.label} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < item.timeline.length - 1 && (
                      <>
                        <span aria-hidden="true" className="absolute left-[11px] top-6 h-full w-0.5 bg-line" />
                        {past && (
                          <span
                            aria-hidden="true"
                            className="grow-y absolute left-[11px] top-6 h-full w-0.5 bg-gradient-to-b from-glow to-accent shadow-[0_0_8px_rgb(111_240_216/0.8)]"
                            style={{ ["--d" as string]: `${i * 250}ms` }}
                          />
                        )}
                      </>
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        past ? "dot-pop border-glow bg-navy text-white" : isNow ? "breathe border-accent bg-accent-soft text-accent" : "border-line bg-night"
                      }`}
                    >
                      {past ? "✓" : ""}
                    </span>
                    <span>
                      <span className={`block font-bold ${isNow ? "text-accent" : ""}`}>
                        {t.label}
                        {isNow && <span className="ml-2 rounded-full bg-accent-solid px-2 py-0.5 text-xs text-white">Next</span>}
                      </span>
                      <span className="text-sm text-muted">
                        {fmt(t.date, { month: "short", day: "numeric", year: "numeric" })}
                        <span className="sr-only">{past ? ", done" : ""}</span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside id="have-your-say" className="scroll-mt-24 space-y-4">
          <div className="space-y-4 lg:sticky lg:top-24">
            {decided ? (
              <div data-reveal className="glass-strong halo grabber rounded-[28px] p-6">
                <h2 className="font-display text-2xl font-extrabold tracking-tight">The {PLACE.words.council} voted</h2>
                <div className="mt-4">
                  <Chamber result={item.result} />
                </div>
                <div className="mt-4">
                  <VoteResult yes={item.result!.yes} no={item.result!.no} passed={item.status === "passed"} />
                </div>
                <p className="mt-4">
                  <strong>What happens next:</strong> {item.result!.nextStep}
                </p>
              </div>
            ) : hydrated ? (
              <CommentBox item={item} />
            ) : (
              <div className="h-80 animate-pulse rounded-[28px] bg-white/5" aria-hidden="true" />
            )}
            <div data-reveal className="glass mt-8 rounded-[28px] p-5">
              <h2 className="mb-3 text-sm font-bold">What neighbors told the {PLACE.words.council}</h2>
              <Sentiment support={item.comments.support} oppose={item.comments.oppose} />
            </div>
            {!decided && (
              <div className="glass rounded-[28px] p-5">
                <h2 className="text-sm font-bold">Who decides</h2>
                <p className="mb-2 text-xs text-muted">Tap or hover a seat to meet each {PLACE.words.member}.</p>
                <Chamber />
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function Fact({ label, children, i }: { label: string; children: React.ReactNode; i: number }) {
  return (
    <div data-reveal className="glass rounded-[28px] p-4 transition hover:-translate-y-1" style={{ ["--d" as string]: `${i * 80}ms` }}>
      <p className="eyebrow text-glow/90">{label}</p>
      <p className="mt-1 font-bold leading-snug">{children}</p>
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href.split("#")[0];
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast("Link copied. Send it to a neighbor", "🔗");
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="group inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold transition hover:border-glow active:scale-95"
    >
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
      <span aria-live="polite">{copied ? "Link copied" : "Share with a neighbor"}</span>
    </button>
  );
}
