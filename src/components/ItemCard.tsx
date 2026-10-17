"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { PERSONAS, TOPICS, meetingFor, type AgendaItem } from "@/lib/data";
import { toggleFollow, useStore } from "@/lib/store";
import { daysFromToday, fmt, inDays, relevance, whereLabel } from "@/lib/util";
import { Sentiment } from "./Sentiment";
import { toast } from "./Toast";
import { Tilt } from "./Tilt";
import { TopicTag } from "./TopicTag";

export function ItemCard({ item }: { item: AgendaItem }) {
  const s = useStore();
  const meeting = meetingFor(item);
  const r = relevance(item, s);
  const following = s.following.includes(item.id);
  const commented = s.comments.some((c) => c.itemId === item.id);
  const days = daysFromToday(meeting.date);
  const firstPersona = r.personas[0];

  return (
    <Tilt max={4} className="h-full w-full rounded-[28px]">
    <article
      className="glass group relative flex h-full flex-col rounded-[28px] p-5 transition-shadow duration-300 hover:shadow-[0_0_0_1px_var(--topic-edge),0_30px_70px_-20px_var(--topic-glow)] sm:p-6"
      style={{
        ["--topic-edge" as string]: `color-mix(in srgb, ${TOPICS[item.topic].color} 45%, transparent)`,
        ["--topic-glow" as string]: `color-mix(in srgb, ${TOPICS[item.topic].color} 40%, transparent)`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 pr-10">
        <ViewTransition name={`item-topic-${item.id}`} share="morph" default="none">
          <TopicTag topic={item.topic} />
        </ViewTransition>
        <span className="text-xs font-bold text-muted">
          Vote {fmt(meeting.date, { month: "short", day: "numeric" })} · {inDays(days)}
        </span>
        {r.nearYou && (
          <span className="breathe rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent ring-1 ring-accent/30">📍 Near you</span>
        )}
      </div>

      <h3 className="mt-3">
        <Link
          href={`/item/${item.id}`}
          transitionTypes={["nav-forward"]}
          className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none"
        >
          <ViewTransition name={`item-title-${item.id}`} share="morph" default="none">
            {s.councilLanguage ? (
              <span key="official" className="official flip-in block text-[1.05rem] leading-snug text-ink/90">
                <span className="font-bold">{item.number}.</span> {item.officialTitle}
              </span>
            ) : (
              <span key="plain" className="flip-in block font-display text-xl font-bold leading-tight tracking-tight">
                {item.title}
              </span>
            )}
          </ViewTransition>
        </Link>
      </h3>

      {firstPersona && item.forYou[firstPersona] ? (
        <p className="mt-4 rounded-2xl bg-[linear-gradient(135deg,rgb(111_240_216/0.12),rgb(255_197_110/0.06))] p-3.5 text-sm ring-1 ring-glow/20">
          <span className="font-bold">
            {PERSONAS[firstPersona].emoji} For you:
          </span>{" "}
          {item.forYou[firstPersona]}
        </p>
      ) : (
        <p className="mt-3 line-clamp-3 text-sm text-muted">{item.summary}</p>
      )}

      <div className="mt-auto pt-4">
        <p className="mb-3 text-xs text-muted">
          <span className="font-bold text-ink">Where:</span> {whereLabel(item)} · <span className="font-bold text-ink">Cost:</span>{" "}
          {item.cost}
        </p>
        <Sentiment support={item.comments.support} oppose={item.comments.oppose} />
        <div className="relative z-10 mt-4 flex items-center justify-between gap-2">
          {commented ? (
            <span className="text-sm font-bold text-support">✓ You commented</span>
          ) : (
            <Link
              href={`/item/${item.id}#have-your-say`}
              transitionTypes={["nav-forward"]}
              className="btn-ember rounded-full px-4 py-2 text-sm font-bold"
            >
              Have your say <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          toggleFollow(item.id);
          toast(following ? "Stopped following" : "Following. We'll show you the vote result", following ? "🔕" : "🔖");
        }}
        aria-pressed={following}
        aria-label={following ? "Unfollow this item" : "Follow this item"}
        className={`chip-pop absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border transition hover:scale-110 active:scale-90 ${
          following ? "border-glow bg-navy text-white shadow-[0_0_18px_-2px_rgb(111_240_216/0.8)]" : "border-line bg-white/5 text-muted hover:border-glow hover:text-glow"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill={following ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
          <path d="M6 3h12v18l-6-4-6 4z" strokeLinejoin="round" />
        </svg>
      </button>
    </article>
    </Tilt>
  );
}
