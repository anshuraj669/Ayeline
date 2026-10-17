import { PLACE, TODAY, type AgendaItem, type Job, type Persona, type Service } from "./data";
import type { State } from "./store";

const DAY = 24 * 60 * 60 * 1000;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysFromToday(iso: string): number {
  return Math.round((parseDate(iso).getTime() - parseDate(TODAY).getTime()) / DAY);
}

export function fmt(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return parseDate(iso).toLocaleDateString("en-US", opts);
}

export function inDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export interface Relevance {
  personas: Persona[];
  nearYou: boolean;
}

/** Why an item matters to this resident: which of their roles it touches, and whether it's in their area. */
export function relevance(item: AgendaItem, s: Pick<State, "personas" | "neighborhood">): Relevance {
  const personas = s.personas.filter((p) => item.forYou[p]);
  const nearYou = s.neighborhood !== null && item.neighborhoods !== "citywide" && item.neighborhoods.includes(s.neighborhood);
  return { personas, nearYou };
}

export function isRelevant(r: Relevance) {
  return r.personas.length > 0 || r.nearYou;
}

export function whereLabel(item: AgendaItem): string {
  return item.neighborhoods === "citywide" ? cap(PLACE.words.everywhere) : item.neighborhoods.join(", ");
}

/** Capitalizes the first letter, for words from PLACE that start a sentence. */
export function cap(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

/** The line for one service: visits under way first, then everyone waiting, in token order. */
export function queueFor(jobs: Job[], service: string) {
  const mine = jobs.filter((j) => j.service === service);
  return {
    visiting: mine.filter((j) => j.status === "visiting").sort((a, b) => a.token - b.token),
    waiting: mine.filter((j) => j.status === "queued").sort((a, b) => a.token - b.token),
  };
}

/**
 * Rough wait before a crew reaches the job at `position` (0 = next in line). Each
 * crew clears one job per `minutes`, and crews already out are halfway through.
 */
export function estimateWait(service: Service, position: number, visiting: number): number {
  const team = service.team.length;
  const free = Math.max(0, team - visiting);
  if (position < free) return 0;
  const rounds = Math.floor((position - free) / team);
  return Math.round(service.minutes / 2 + rounds * service.minutes);
}

export function duration(minutes: number): string {
  if (minutes <= 0) return "next free crew";
  if (minutes < 60) return `about ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round((minutes % 60) / 15) * 15;
  return `about ${h} h${m ? ` ${m} min` : ""}`;
}

export function tokenLabel(service: Service, token: number): string {
  return `${service.code}-${String(token).padStart(2, "0")}`;
}
