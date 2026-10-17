import type { Metadata } from "next";
import { Fragment } from "react";
import { Bricolage_Grotesque, Instrument_Serif, Public_Sans } from "next/font/google";
import { Ambient } from "@/components/Ambient";
import { CommandPalette } from "@/components/CommandPalette";
import { Header, Logo } from "@/components/Header";
import { RevealObserver } from "@/components/Motion";
import { Toaster } from "@/components/Toast";
import { PLACE } from "@/lib/data";
import "./globals.css";

// Public Sans is the typeface of the U.S. Web Design System, built for government services.
const publicSans = Public_Sans({ variable: "--font-public", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["600", "700", "800"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: `Ayeline · ${PLACE.body}, made readable`,
  applicationName: "Ayeline",
  appleWebApp: { title: "Ayeline" },
  description:
    `See what ${PLACE.body} is voting on, what it means for you, and have your say in under a minute.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body
        className={`${publicSans.variable} ${bricolage.variable} ${instrument.variable} antialiased`}
        suppressHydrationWarning
      >
        <Ambient />
        <RevealObserver />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-night"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
          {children}
        </main>
        <footer className="px-4 pb-28 pt-10 text-center text-sm text-muted md:pb-[12vh]">
          <div className="glass mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full px-5 py-2.5">
            <Logo className="h-5 w-5" />
            <span>Ayeline prototype</span>
            {PLACE.note.split(" · ").map((part) => (
              <Fragment key={part}>
                <span aria-hidden="true">·</span>
                <span>{part}</span>
              </Fragment>
            ))}
          </div>
        </footer>
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}
