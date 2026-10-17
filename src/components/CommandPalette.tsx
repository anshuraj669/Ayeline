"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CITY, ITEMS, NOTICE_KINDS, NOTICES, PLACE, SERVICES, TOPICS } from "@/lib/data";
import { whereLabel } from "@/lib/util";

interface Entry {
  href: string;
  icon: string;
  title: string;
  hint: string;
  keywords: string;
  color?: string;
}

const PAGES: Entry[] = [
  { href: "/", icon: "🏛️", title: "Agenda", hint: `Everything the ${PLACE.words.council} is voting on`, keywords: "home feed agenda" },
  { href: "/swipe", icon: "🃏", title: "Quick take", hint: "Swipe through the agenda in a minute", keywords: "swipe quick react cards" },
  { href: "/#map", icon: "🗺️", title: `Map of ${CITY}`, hint: "What's happening in each neighborhood", keywords: "map neighborhood where" },
  { href: "/community", icon: "📌", title: "City notices", hint: "Festivals, games, town halls and alerts", keywords: "community notices events festival closure alert" },
  {
    href: "/community/services",
    icon: "🚧",
    title: "Report a problem",
    hint: SERVICES.map((s) => s.label).join(", "),
    keywords: "311 report problem repair queue request crew fix",
  },
  { href: "/my-voice", icon: "🗣️", title: "My voice", hint: "Your comments and followed items", keywords: "my voice comments following" },
];

const NOTICE_ENTRIES: Entry[] = NOTICES.map((n) => ({
  href: `/community#notice-${n.id}`,
  icon: n.emoji,
  title: n.title,
  hint: `${NOTICE_KINDS[n.kind].label} · ${n.date} · ${n.venue}`,
  keywords: `${n.body} ${NOTICE_KINDS[n.kind].label}`.toLowerCase(),
}));

const ENTRIES: Entry[] = ITEMS.map((i) => ({
  href: `/item/${i.id}`,
  icon: TOPICS[i.topic].emoji,
  title: i.title,
  hint: `${i.number} · ${TOPICS[i.topic].label} · ${whereLabel(i)}${i.status === "upcoming" ? "" : i.status === "passed" ? " · Passed" : " · Did not pass"}`,
  keywords: `${i.officialTitle} ${i.summary} ${TOPICS[i.topic].label} ${whereLabel(i)}`.toLowerCase(),
  color: TOPICS[i.topic].color,
}));

/** Every word typed must appear somewhere in the entry. */
function search(q: string): Entry[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const all = [...PAGES, ...ENTRIES, ...NOTICE_ENTRIES];
  if (!words.length) return all;
  return all.filter((e) => {
    const hay = `${e.title} ${e.hint} ${e.keywords}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export const openPalette = () => window.dispatchEvent(new Event("open-palette"));

/** ⌘K / Ctrl+K search across every agenda item and page, in a floating glass window. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const listId = useId();
  const results = search(q);

  const show = () => {
    returnTo.current = document.activeElement as HTMLElement;
    setQ("");
    setActive(0);
    setClosing(false);
    setOpen(true);
  };
  const hide = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      returnTo.current?.focus();
    }, 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", show);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const go = (e: Entry) => {
    hide();
    router.push(e.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) go(results[active]);
    else if (e.key === "Tab") e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div
        aria-hidden="true"
        onClick={hide}
        className={`absolute inset-0 bg-[#010b11]/60 backdrop-blur-md ${closing ? "fade-out" : "fade-in"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the agenda"
        className={`glass-strong halo relative w-full max-w-xl overflow-hidden rounded-[28px] ${closing ? "palette-out" : "palette-in"}`}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-glow" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            placeholder={`Search ${PLACE.searchHint}…`}
            className="h-16 w-full bg-transparent text-lg placeholder:text-muted/70 focus:outline-none focus-visible:outline-none"
          />
          <kbd className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold text-muted ring-1 ring-line">esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Results" className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-muted">Nothing on the agenda matches &ldquo;{q}&rdquo;.</li>}
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(r)}
              className={`rise relative flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 ${
                i === active ? "bg-white/10" : ""
              }`}
              style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
            >
              {i === active && <span aria-hidden="true" className="pop absolute inset-y-2 left-0 w-1 rounded-full bg-glow shadow-[0_0_10px_var(--glow)]" />}
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ring-line"
                style={{ background: r.color ? `color-mix(in srgb, ${r.color} 15%, transparent)` : "rgb(255 255 255 / 0.05)" }}
              >
                {r.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold">{r.title}</span>
                <span className="block truncate text-xs text-muted">{r.hint}</span>
              </span>
              {i === active && (
                <span aria-hidden="true" className="ml-auto text-glow">
                  ↵
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="flex gap-4 border-t border-line px-5 py-2.5 text-xs text-muted">
          <span>
            <kbd className="font-bold text-ink">↑↓</kbd> move
          </span>
          <span>
            <kbd className="font-bold text-ink">↵</kbd> open
          </span>
          <span className="ml-auto">
            <kbd className="font-bold text-ink">⌘K</kbd> anywhere
          </span>
        </p>
      </div>
    </div>
  );
}
