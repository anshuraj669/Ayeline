"use client";

import { useSyncExternalStore } from "react";
import type { Neighborhood, Persona } from "./data";

export type Stance = "support" | "oppose" | "question";
/** A gut reaction from Quick take, lighter than a comment. */
export type Reaction = "support" | "oppose" | "skip";

export interface SentComment {
  itemId: string;
  stance: Stance;
  text: string;
  name: string;
  sentAt: string;
}

export interface State {
  onboarded: boolean;
  personas: Persona[];
  neighborhood: Neighborhood | null;
  following: string[];
  comments: SentComment[];
  councilLanguage: boolean;
  reactions: Record<string, Reaction>;
  /** Remembered so the report form is filled in next time. Reports themselves live on the server (community.ts). */
  location: string;
}

const KEY = "ayeline:v1";
const INITIAL: State = {
  onboarded: false,
  personas: [],
  neighborhood: null,
  following: [],
  comments: [],
  councilLanguage: false,
  reactions: {},
  location: "",
};

let state: State | null = null;
const listeners = new Set<() => void>();

// Storage can throw (private mode, blocked site data); the app then just runs in memory.
function get(): State {
  if (state === null) {
    try {
      const raw = window.localStorage.getItem(KEY);
      state = raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
    } catch {
      state = INITIAL;
    }
  }
  return state!;
}

function set(patch: Partial<State>) {
  state = { ...get(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, get, () => INITIAL);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function saveProfile(personas: Persona[], neighborhood: Neighborhood | null) {
  set({ personas, neighborhood, onboarded: true });
}

export function toggleFollow(id: string) {
  const f = get().following;
  set({ following: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
}

export function addComment(c: SentComment) {
  const s = get();
  set({
    comments: [...s.comments.filter((x) => x.itemId !== c.itemId), c],
    following: s.following.includes(c.itemId) ? s.following : [...s.following, c.itemId],
  });
}

export function setCouncilLanguage(on: boolean) {
  set({ councilLanguage: on });
}

export function setReaction(id: string, r: Reaction) {
  set({ reactions: { ...get().reactions, [id]: r } });
}

export function clearReactions() {
  set({ reactions: {} });
}

export function removeReaction(id: string) {
  const next = { ...get().reactions };
  delete next[id];
  set({ reactions: next });
}

export function rememberLocation(location: string) {
  set({ location });
}
