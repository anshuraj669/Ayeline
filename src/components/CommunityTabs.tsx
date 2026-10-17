"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIndicator } from "./Motion";

const TABS = [
  { href: "/community", label: "City notices", icon: "📌" },
  { href: "/community/services", label: "Report a problem", icon: "🚧" },
];

/** Switches between the two halves of Community, with a gliding pill. */
export function CommunityTabs() {
  const pathname = usePathname();
  const [ref, pill] = useIndicator<HTMLElement, HTMLSpanElement>(pathname);
  return (
    <nav ref={ref} aria-label="Community" className="glass-strong rise relative mx-auto flex w-fit gap-1 rounded-full p-1.5">
      <span
        ref={pill}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-full bg-[linear-gradient(135deg,#ffd88a,#ff9f80)] opacity-0 shadow-[0_0_24px_-4px_rgb(255_197_110/0.8)] transition-[transform,width,opacity] duration-500 ease-spring"
      />
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            data-active={active}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors duration-300 sm:px-4 ${
              active ? "text-[#2a1204]" : "text-ink hover:bg-white/10"
            }`}
          >
            <span aria-hidden="true" className="hidden min-[400px]:inline">
              {t.icon}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
