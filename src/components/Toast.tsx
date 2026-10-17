"use client";

import { useSyncExternalStore } from "react";

interface Toast {
  id: number;
  icon: string;
  text: string;
  leaving: boolean;
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Shows a short confirmation that floats up from the bottom of the screen. */
export function toast(text: string, icon = "✦") {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, icon, text, leaving: false }];
  emit();
  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    emit();
  }, 2600);
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3000);
}

const EMPTY: Toast[] = [];

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 md:bottom-5 flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div
          key={t.id}
          className={`glass-strong flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-sm font-bold ${t.leaving ? "toast-out" : "toast-in"}`}
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-soft ring-1 ring-glow/30">
            {t.icon}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
