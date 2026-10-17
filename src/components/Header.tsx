"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { CITY } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";
import { openPalette } from "./CommandPalette";
import { useIndicator } from "./Motion";

/** A lens with City Hall seen through it. */
export function Logo({ className = "" }: { className?: string }) {
  // useId output can contain characters that aren't valid inside url(#...).
  const id = "logo" + useId().replace(/[^\w-]/g, "");
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#6ff0d8" />
          <stop offset="0.6" stopColor="#ffc56e" />
          <stop offset="1" stopColor="#ff8f7a" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#1d5a63" />
          <stop offset="1" stopColor="#04212a" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="13.5" cy="13.5" r="9.6" />
        </clipPath>
      </defs>
      <path d="m20.5 20.5 7.5 7.5" stroke={`url(#${id}-rim)`} strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="13.5" cy="13.5" r="9.6" fill={`url(#${id}-glass)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="4" y="17" width="19" height="7" fill="#6ff0d8" opacity="0.25" />
        <path d="M8.5 14.5 13.5 11l5 3.5z" fill="#6ff0d8" />
        <rect x="9.3" y="15" width="1.6" height="5" fill="#6ff0d8" />
        <rect x="12.7" y="15" width="1.6" height="5" fill="#6ff0d8" />
        <rect x="16.1" y="15" width="1.6" height="5" fill="#6ff0d8" />
        <rect x="8" y="20" width="11" height="1.6" fill="#6ff0d8" />
        <circle cx="18.5" cy="8" r="1.3" fill="#ffd88a" />
        <rect className="glint" x="8" y="-2" width="4" height="34" fill="white" opacity="0.35" />
      </g>
      <circle cx="13.5" cy="13.5" r="10.6" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.2" />
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Agenda", short: "Agenda", icon: "🏛️" },
  { href: "/swipe", label: "Quick take", short: "Swipe", icon: "🃏" },
  { href: "/community", label: "Community", short: "Community", icon: "🏘️" },
  { href: "/my-voice", label: "My voice", short: "My voice", icon: "🗣️" },
];

function useNavState() {
  const pathname = usePathname();
  const { comments, following, reactions } = useStore();
  const hydrated = useHydrated();
  const count = hydrated ? new Set([...comments.map((c) => c.itemId), ...following, ...Object.keys(reactions)]).size : 0;
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/item") : pathname.startsWith(href));
  return { key: `${pathname}:${count}`, count, isActive };
}

export function Header() {
  const { key, count, isActive } = useNavState();
  const [navRef, pillRef] = useIndicator<HTMLElement, HTMLSpanElement>(key);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4" style={{ viewTransitionName: "site-header" }}>
        <div className="glass-strong rise mx-auto flex h-14 max-w-4xl items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5">
          <Link href="/" className="group mr-auto flex items-center gap-2.5" aria-label="Ayeline home">
            <Logo className="h-9 w-9 transition-transform duration-500 ease-spring group-hover:rotate-[-12deg] group-hover:scale-110" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              Aye<span className="font-serif text-[1.3rem] font-normal italic text-glow">line</span>
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-bold text-muted ring-1 ring-line lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              {CITY}
            </span>
          </Link>
          <nav ref={navRef} aria-label="Main" className="relative hidden items-center gap-1 md:flex">
            <span
              ref={pillRef}
              aria-hidden="true"
              className="absolute left-0 top-0 rounded-full bg-[linear-gradient(135deg,#f4fffc,#c9f7ee)] opacity-0 shadow-[0_0_24px_-4px_rgb(111_240_216/0.8)] transition-[transform,width,opacity] duration-500 ease-spring"
            />
            {LINKS.map(({ href, label }) => {
              const active = isActive(href);
              const badge = href === "/my-voice" ? count : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-colors duration-300 ${
                    active ? "text-night" : "text-ink hover:bg-white/10"
                  }`}
                >
                  {label}
                  {badge ? (
                    <span key={badge} className={`pop rounded-full px-1.5 text-xs leading-5 ${active ? "bg-night text-white" : "bg-accent-solid text-white"}`}>
                      {badge}
                      <span className="sr-only"> items</span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search (Ctrl or Command + K)"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition duration-300 ease-spring hover:scale-110 hover:bg-white/10 hover:text-glow active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      <Dock />
    </>
  );
}

/** On phones the navigation floats at the bottom, within thumb's reach, like a visionOS ornament. */
function Dock() {
  const { key, count, isActive } = useNavState();
  const [navRef, pillRef] = useIndicator<HTMLElement, HTMLSpanElement>(key);
  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="glass-strong dock-in fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[26px] p-1.5 md:hidden"
      style={{ viewTransitionName: "site-dock" }}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-[20px] bg-[linear-gradient(135deg,rgb(111_240_216/0.28),rgb(255_197_110/0.18))] opacity-0 ring-1 ring-glow/40 transition-[transform,width,opacity] duration-500 ease-spring"
      />
      {LINKS.map(({ href, short, icon }) => {
        const active = isActive(href);
        const badge = href === "/my-voice" ? count : 0;
        return (
          <Link
            key={href}
            href={href}
            data-active={active}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-1.5 text-[0.7rem] font-bold transition-colors duration-300 ${active ? "text-ink" : "text-muted"}`}
          >
            <span aria-hidden="true" className={`text-xl transition-transform duration-500 ease-spring ${active ? "-translate-y-0.5 scale-110" : ""}`}>
              {icon}
            </span>
            {short}
            {badge ? (
              <span key={badge} className="pop absolute right-[18%] top-0.5 rounded-full bg-accent-solid px-1.5 text-[0.65rem] leading-4 text-white">
                {badge}
                <span className="sr-only"> items</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
