"use client";

import Link from "next/link";
import { CountUp } from "@/components/Motion";
import { TopicTag } from "@/components/TopicTag";
import { VoteResult } from "@/components/VoteResult";
import { useCommunity, type Community } from "@/lib/community";
import { CITY, ITEMS, NOTICES, PLACE, SERVICES, meetingFor, type AgendaItem, type Job, type Notice } from "@/lib/data";
import { toggleFollow, useHydrated, useStore, type Reaction, type SentComment } from "@/lib/store";
import { daysFromToday, duration, estimateWait, fmt, inDays, queueFor, tokenLabel } from "@/lib/util";

const STANCE_LABEL = { support: "👍 You support", oppose: "👎 You oppose", question: "🤔 You raised a concern" };

export default function MyVoicePage() {
  const s = useStore();
  const hydrated = useHydrated();

  const commented = s.comments
    .map((c) => ({ c, item: ITEMS.find((i) => i.id === c.itemId)! }))
    .filter((x) => x.item);
  const following = ITEMS.filter((i) => s.following.includes(i.id) && !s.comments.some((c) => c.itemId === i.id));
  // A comment says more than a swipe, so commented items only appear under comments.
  const takes = ITEMS.filter((i) => s.reactions[i.id] && !s.comments.some((c) => c.itemId === i.id)).map((item) => ({
    item,
    r: s.reactions[item.id],
  }));
  const community = useCommunity();
  const reports = community.jobs.filter((j) => j.mine && (j.status === "queued" || j.status === "visiting"));
  const going = NOTICES.filter((n) => community.rsvps[n.id]?.mine && daysFromToday(n.date) >= 0);
  const hasCommunity = reports.length > 0 || going.length > 0;
  const nextVote = [...commented.map((x) => x.item), ...following, ...takes.map((t) => t.item)]
    .filter((i) => i.status === "upcoming")
    .map((i) => meetingFor(i).date)
    .sort()[0];

  return (
    <div className="py-10">
      <p className="eyebrow rise text-glow">Your civic record</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        <span className="word">My</span>{" "}
        <span className="word font-serif text-[1.15em] font-normal italic" style={{ ["--i" as string]: 1 }}>
          <span className="text-aurora">voice</span>
        </span>
      </h1>
      <p className="rise mt-2 max-w-2xl text-lg text-muted" style={{ animationDelay: "250ms" }}>
        Everything you&apos;ve weighed in on or are following, and what the {PLACE.words.council} decided.
      </p>

      {!hydrated ? (
        <div className="mt-8 h-60 animate-pulse rounded-[28px] bg-white/5" aria-hidden="true" />
      ) : commented.length === 0 && following.length === 0 && takes.length === 0 && !hasCommunity ? (
        <div data-reveal className="glass-strong halo grabber mt-8 rounded-[32px] p-10 text-center">
          <p className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-navy-soft text-4xl ring-1 ring-glow/30" aria-hidden="true">
            <span className="breathe rounded-full">🗣️</span>
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold">You haven&apos;t weighed in yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Most {PLACE.words.council} votes get fewer than 50 public comments. One thoughtful comment from you really can change the
            conversation.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-full btn-ember px-6 py-3 font-bold">
            See what&apos;s on the agenda
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-3 gap-3">
            <Stat i={0} label="Comments sent" value={<CountUp value={commented.length} duration={900} />} />
            <Stat i={1} label="Following" value={<CountUp value={following.length + commented.length} duration={900} />} />
            <Stat i={2} label="Next vote" value={nextVote ? fmt(nextVote, { month: "short", day: "numeric" }) : "—"} />
          </dl>

          {commented.length > 0 && (
            <section aria-labelledby="sent" className="mt-10">
              <h2 id="sent" className="font-display text-2xl font-extrabold tracking-tight">
                Your comments
              </h2>
              <ul className="mt-4 space-y-3">
                {commented.map(({ c, item }, i) => (
                  <li key={c.itemId} data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
                    <CommentRow c={c} item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {takes.length > 0 && <QuickTakes takes={takes} />}

          {hasCommunity && <YourCommunity reports={reports} going={going} community={community} />}

          {following.length > 0 && (
            <section aria-labelledby="following" className="mt-10">
              <h2 id="following" className="font-display text-2xl font-extrabold tracking-tight">
                Following
              </h2>
              <ul className="mt-4 space-y-3">
                {following.map((item, i) => (
                  <li key={item.id} data-reveal className="glass flex flex-wrap items-center gap-4 rounded-[28px] p-5" style={{ ["--d" as string]: `${i * 80}ms` }}>
                    <div className="min-w-0 flex-1">
                      <TopicTag topic={item.topic} />
                      <Link href={`/item/${item.id}`} className="mt-2 block font-display text-lg font-bold leading-tight hover:underline">
                        {item.title}
                      </Link>
                      <div className="mt-2">
                        <Status item={item} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.status === "upcoming" && (
                        <Link href={`/item/${item.id}#have-your-say`} className="btn-ember rounded-full px-4 py-2 text-sm font-bold">
                          Have your say
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleFollow(item.id)}
                        className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm font-bold transition hover:border-oppose hover:text-oppose active:scale-95"
                      >
                        Unfollow
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="how" data-reveal className="glass-strong halo grabber mt-14 rounded-[32px] p-6 sm:p-8">
        <h2 id="how" className="font-display text-2xl font-extrabold tracking-tight">
          How public comment works in {CITY}
        </h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          {PLACE.process.map(({ title, body }, i) => (
            <li key={title} className="relative">
              {i < PLACE.process.length - 1 && (
                <span aria-hidden="true" className="grow-x absolute left-11 right-0 top-[18px] hidden h-px bg-gradient-to-r from-accent/60 to-transparent sm:block" />
              )}
              <span className="btn-ember dot-pop flex h-9 w-9 items-center justify-center rounded-full font-bold" style={{ ["--i" as string]: i * 3 }}>
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const TAKE: Record<Reaction, { label: string; icon: string; color: string }> = {
  support: { label: "You'd support it", icon: "♥", color: "var(--support)" },
  oppose: { label: "You'd oppose it", icon: "✕", color: "var(--oppose)" },
  skip: { label: "Not sure yet", icon: "?", color: "var(--lilac)" },
};

function QuickTakes({ takes }: { takes: { item: AgendaItem; r: Reaction }[] }) {
  const count = (r: Reaction) => takes.filter((t) => t.r === r).length;
  return (
    <section aria-labelledby="takes" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="takes" className="font-display text-2xl font-extrabold tracking-tight">
            Your quick takes
          </h2>
          <p className="text-muted">Gut reactions from Quick take. Only a comment reaches the {PLACE.words.council}.</p>
        </div>
        <Link href="/swipe" className="text-sm font-bold text-accent underline underline-offset-4">
          Back to Quick take
        </Link>
      </div>

      {/* How you lean overall, as one bar. */}
      <div data-reveal className="glass mt-4 rounded-[28px] p-5">
        <div className="grow-x flex h-3 gap-1 overflow-hidden rounded-full" aria-hidden="true">
          {(["support", "oppose", "skip"] as const).map((r) =>
            count(r) ? (
              <span
                key={r}
                className="rounded-full"
                style={{ flex: count(r), background: TAKE[r].color, boxShadow: `0 0 14px ${TAKE[r].color}` }}
              />
            ) : null,
          )}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
          {(["support", "oppose", "skip"] as const).map((r) => (
            <span key={r} style={{ color: TAKE[r].color }}>
              {TAKE[r].icon} <CountUp value={count(r)} duration={900} /> {r === "skip" ? "not sure" : r}
            </span>
          ))}
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {takes.map(({ item, r }, i) => {
          const total = item.comments.support + item.comments.oppose;
          const share = Math.round(((r === "oppose" ? item.comments.oppose : item.comments.support) / total) * 100);
          return (
            <li
              key={item.id}
              data-reveal
              className="glass flex flex-wrap items-center gap-4 rounded-[28px] p-5"
              style={{ ["--d" as string]: `${i * 70}ms` }}
            >
              <span
                aria-hidden="true"
                className="dot-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ring-1"
                style={{
                  ["--i" as string]: i,
                  color: TAKE[r].color,
                  background: `color-mix(in srgb, ${TAKE[r].color} 14%, transparent)`,
                  ["--tw-ring-color" as string]: `color-mix(in srgb, ${TAKE[r].color} 40%, transparent)`,
                }}
              >
                {TAKE[r].icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold" style={{ color: TAKE[r].color }}>
                  {TAKE[r].label}
                </p>
                <Link href={`/item/${item.id}`} className="mt-0.5 block font-display text-lg font-bold leading-tight hover:underline">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {r === "skip"
                    ? `Neighbors so far: ${Math.round((item.comments.support / total) * 100)}% support. Read both sides before you decide.`
                    : `You're with ${share}% of the ${total} neighbors who commented.`}
                </p>
              </div>
              {item.status === "upcoming" ? (
                <Link href={`/item/${item.id}#have-your-say`} className="btn-ember rounded-full px-4 py-2 text-sm font-bold">
                  {r === "skip" ? "Ask a question" : "Turn it into a comment"}
                </Link>
              ) : (
                <Status item={item} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function YourCommunity({ reports, going, community }: { reports: Job[]; going: Notice[]; community: Community }) {
  return (
    <section aria-labelledby="community" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="community" className="font-display text-2xl font-extrabold tracking-tight">
          Around town
        </h2>
        <Link href="/community" className="text-sm font-bold text-accent underline underline-offset-4">
          City notices
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {reports.map((j, i) => {
          const sv = SERVICES.find((x) => x.id === j.service)!;
          const q = queueFor(community.jobs, sv.id);
          const position = q.waiting.findIndex((w) => w.id === j.id);
          return (
            <li key={j.id} data-reveal style={{ ["--d" as string]: `${i * 70}ms` }}>
              <Link href="/community/services" className="glass flex items-center gap-4 rounded-[24px] p-4 transition hover:bg-white/[0.07]">
                <span className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(160deg,rgb(255_197_110/0.3),rgb(255_143_122/0.15))] ring-1 ring-accent/30">
                  <span aria-hidden="true">{sv.emoji}</span>
                  <span className="text-xs font-extrabold">{tokenLabel(sv, j.token)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">
                    {sv.label} <span className="font-normal text-muted">· {j.location}</span>
                  </span>
                  <span className={`block text-sm ${j.status === "visiting" ? "text-support" : "text-muted"}`}>
                    {j.status === "visiting"
                      ? `${j.staff} is on it now`
                      : `${position === 0 ? "Next in line" : `#${position + 1} in line`} · ${duration(estimateWait(sv, position, q.visiting.length))}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {going.map((n, i) => (
          <li key={n.id} data-reveal style={{ ["--d" as string]: `${(reports.length + i) * 70}ms` }}>
            <Link href={`/community#notice-${n.id}`} className="glass flex items-center gap-4 rounded-[24px] p-4 transition hover:bg-white/[0.07]">
              <span aria-hidden="true" className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-soft text-3xl ring-1 ring-glow/30">
                {n.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-bold leading-tight">{n.title}</span>
                <span className="block text-sm text-muted">
                  {fmt(n.date)} · {n.time} · {community.rsvps[n.id].mine === 1 ? "just you" : `you + ${community.rsvps[n.id].mine - 1}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Status({ item }: { item: AgendaItem }) {
  if (item.result) return <VoteResult yes={item.result.yes} no={item.result.no} passed={item.status === "passed"} />;
  const m = meetingFor(item);
  return (
    <p className="text-sm font-bold text-muted">
      ⏳ Vote {fmt(m.date)} · {inDays(daysFromToday(m.date))}. We&apos;ll show the result here.
    </p>
  );
}

function CommentRow({ c, item }: { c: SentComment; item: AgendaItem }) {
  return (
    <article className="glass rounded-[28px] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <TopicTag topic={item.topic} />
        <span className="text-xs font-bold text-muted">Sent {new Date(c.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
      <Link href={`/item/${item.id}`} className="mt-2 block font-display text-lg font-bold leading-tight hover:underline">
        {item.title}
      </Link>
      <p className="mt-3 text-sm font-bold">{STANCE_LABEL[c.stance]}</p>
      <p className="mt-1 line-clamp-3 border-l-2 border-glow/60 pl-3 font-serif text-lg italic leading-snug text-ink/85">&ldquo;{c.text}&rdquo;</p>
      <div className="mt-4 border-t border-line pt-3">
        <Status item={item} />
      </div>
    </article>
  );
}

function Stat({ label, value, i }: { label: string; value: React.ReactNode; i: number }) {
  return (
    <div data-reveal className="glass rounded-[28px] p-4" style={{ ["--d" as string]: `${i * 90}ms` }}>
      <dt className="eyebrow text-glow/90">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-extrabold">{value}</dd>
    </div>
  );
}
