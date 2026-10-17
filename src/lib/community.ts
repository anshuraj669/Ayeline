"use client";

import { useSyncExternalStore } from "react";
import type { Job } from "./data";

/**
 * Service requests and RSVPs, shared by everyone through the server (see
 * src/server/community). Every open page listens for changes and refetches, so a
 * crew marking a job done shows up on every resident's phone within a moment.
 */

export interface Community {
  status: "loading" | "live" | "offline";
  jobs: Job[];
  rsvps: Record<string, { total: number; mine: number }>;
  /** Whether this browser has unlocked the staff board. */
  staff: boolean;
}

const LOADING: Community = { status: "loading", jobs: [], rsvps: {}, staff: false };
let state: Community = LOADING;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const DEVICE_KEY = "ayeline:device";
const PIN_KEY = "ayeline:staff-pin";
let device: string | null = null;
let pin: string | null = null;

/** An anonymous id for this browser, so residents can withdraw their own reports. No account needed. */
function deviceId() {
  if (device) return device;
  try {
    device = localStorage.getItem(DEVICE_KEY);
    if (!device) localStorage.setItem(DEVICE_KEY, (device = crypto.randomUUID()));
  } catch {
    device ??= crypto.randomUUID();
  }
  return device;
}

function staffPin() {
  if (pin === null) {
    try {
      pin = sessionStorage.getItem(PIN_KEY) ?? "";
    } catch {
      pin = "";
    }
  }
  return pin;
}

function headers(): HeadersInit {
  return { "content-type": "application/json", "x-device-id": deviceId(), ...(staffPin() ? { "x-staff-pin": staffPin() } : {}) };
}

function apply(data: Omit<Community, "status">) {
  state = { status: "live", jobs: data.jobs, rsvps: data.rsvps, staff: data.staff };
  emit();
}

async function refresh() {
  try {
    const res = await fetch("/api/community", { headers: headers(), cache: "no-store" });
    if (!res.ok) throw new Error();
    apply(await res.json());
  } catch {
    state = { ...state, status: "offline" };
    emit();
  }
}

// Live updates: one event stream per page, opened while anything is listening.
let source: EventSource | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
const onVisible = () => document.visibilityState === "visible" && refresh();

function connect() {
  refresh();
  source = new EventSource("/api/community/stream");
  source.onmessage = () => refresh();
  source.onopen = () => refresh();
  source.onerror = () => {
    if (state.status !== "offline") {
      state = { ...state, status: "offline" };
      emit();
    }
  };
  // A slow safety net in case a proxy drops the stream without telling us.
  poll = setInterval(refresh, 30_000);
  document.addEventListener("visibilitychange", onVisible);
}

function disconnect() {
  source?.close();
  source = null;
  if (poll) clearInterval(poll);
  document.removeEventListener("visibilitychange", onVisible);
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (listeners.size === 1) connect();
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) disconnect();
  };
}

export function useCommunity(): Community {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

/** Sends one change; resolves with the action's result, or rejects with a message to show. */
async function act<T = null>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/community", { method: "POST", headers: headers(), body: JSON.stringify(body) });
  } catch {
    throw new Error("You're offline. Try again in a moment.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  apply(data);
  return data.result as T;
}

export const report = (input: { service: string; location: string; neighborhood: string; note: string; photo?: string }) =>
  act<{ id: string; token: number }>({ type: "book", ...input });
export const withdraw = (id: string) => act({ type: "cancel", id });
export const dispatchNext = (service: string) => act<{ staff: string; location: string }>({ type: "start", service });
export const markDone = (id: string) => act({ type: "finish", id });
export const rsvp = (notice: string, people: number) => act({ type: "rsvp", notice, people });

/** Loads a report's photo (only its reporter and staff may), as a URL an <img> can show. */
export async function photoUrl(id: string) {
  const res = await fetch(`/api/community/photo/${encodeURIComponent(id)}`, { headers: headers() });
  if (!res.ok) throw new Error("Couldn't load the photo.");
  return URL.createObjectURL(await res.blob());
}

/** Checks a staff PIN with the server and keeps it for this browser tab. */
export async function unlockStaff(candidate: string) {
  const previous = pin;
  pin = candidate;
  try {
    await act({ type: "staff-login" });
    sessionStorage.setItem(PIN_KEY, candidate);
  } catch (e) {
    pin = previous;
    throw e;
  }
}

export function lockStaff() {
  pin = "";
  try {
    sessionStorage.removeItem(PIN_KEY);
  } catch {}
  refresh();
}
