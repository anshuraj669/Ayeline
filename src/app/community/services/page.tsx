"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CommunityTabs } from "@/components/CommunityTabs";
import { CountUp } from "@/components/Motion";
import { Tilt } from "@/components/Tilt";
import { toast } from "@/components/Toast";
import { dispatchNext, lockStaff, markDone, photoUrl, report, unlockStaff, useCommunity, withdraw } from "@/lib/community";
import { COMMUNITY, NEIGHBORHOODS, SERVICES, type Job, type Neighborhood, type Service } from "@/lib/data";
import { shrinkPhoto } from "@/lib/photo";
import { rememberLocation, useStore } from "@/lib/store";
import { duration, estimateWait, queueFor, tokenLabel } from "@/lib/util";

const byId = (id: string) => SERVICES.find((s) => s.id === id)!;
const oops = (e: unknown) => toast(e instanceof Error ? e.message : "Something went wrong", "⚠️");

export default function ServicesPage() {
  const c = useCommunity();
  const [staffView, setStaffView] = useState(false);
  const [reporting, setReporting] = useState<Service | null>(null);
  const staff = staffView && c.staff;
  const mine = c.jobs.filter((j) => j.mine && (j.status === "queued" || j.status === "visiting"));
  const active = SERVICES.filter((sv) => staff || c.jobs.some((j) => j.service === sv.id && (j.status === "queued" || j.status === "visiting")));

  return (
    <div className="py-10">
      <CommunityTabs />
      <header className="mt-8 text-center">
        <p className="eyebrow rise text-accent">{COMMUNITY.desk} · service requests</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight [perspective:800px] sm:text-5xl">
          <span className="word">Report</span>{" "}
          <span className="word" style={{ ["--i" as string]: 1 }}>
            a
          </span>{" "}
          <span className="word" style={{ ["--i" as string]: 2 }}>
            problem.
          </span>{" "}
          <span className="word font-serif text-[1.15em] font-normal italic" style={{ ["--i" as string]: 3 }}>
            <span className="text-aurora">Watch it get fixed.</span>
          </span>
        </h1>
        <p className="rise mx-auto mt-3 max-w-xl text-muted" style={{ animationDelay: "250ms" }}>
          Potholes, dark streetlights, missed pickups. Every report gets a request number, and city crews work through
          them in the order they came in. Everyone sees the same live queue.
        </p>
        <div className="rise mt-6 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "350ms" }}>
          <ViewSwitch staff={staffView} onChange={setStaffView} />
          <LiveBadge status={c.status} />
        </div>
      </header>

      {staffView && !c.staff && <StaffUnlock onCancel={() => setStaffView(false)} />}

      {mine.length > 0 && (
        <section aria-labelledby="tickets" className="mt-10">
          <h2 id="tickets" className="font-display text-2xl font-extrabold tracking-tight">
            Your reports
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {mine.map((j, i) => (
              <li key={j.id} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                <Ticket job={j} jobs={c.jobs} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {!staffView && (
        <section aria-labelledby="services" className="mt-12">
          <h2 id="services" className="font-display text-2xl font-extrabold tracking-tight">
            What&apos;s wrong?
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {SERVICES.map((sv, i) => {
              const q = queueFor(c.jobs, sv.id);
              return (
                <li key={sv.id} data-reveal style={{ ["--d" as string]: `${(i % 4) * 70}ms` }}>
                  <Tilt max={7} className="h-full rounded-[26px]">
                    <button
                      type="button"
                      onClick={() => setReporting(sv)}
                      className="glass group flex h-full w-full flex-col items-start gap-2 rounded-[26px] p-4 text-left transition hover:bg-white/[0.07] sm:p-5"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgb(111_240_216/0.35),rgb(14_124_116/0.25))] text-2xl ring-1 ring-glow/30 transition-transform duration-500 ease-spring group-hover:-translate-y-1 group-hover:rotate-[-8deg] group-hover:scale-110"
                      >
                        {sv.emoji}
                      </span>
                      <span className="font-display text-lg font-extrabold leading-tight">{sv.label}</span>
                      <span className="line-clamp-2 text-xs text-muted">{sv.note}</span>
                      <span className="mt-auto flex flex-wrap gap-x-2 pt-2 text-xs font-bold">
                        {c.status === "loading" ? (
                          <span className="text-muted">Checking the queue…</span>
                        ) : (
                          <span className={q.waiting.length ? "text-accent" : "text-support"}>
                            {q.waiting.length ? `${q.waiting.length} waiting` : "No queue"}
                          </span>
                        )}
                        <span className="text-muted">· {sv.team.length} {sv.team.length === 1 ? COMMUNITY.crewLabel : `${COMMUNITY.crewLabel}s`}</span>
                      </span>
                    </button>
                  </Tilt>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="queues" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="queues" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
            {staff ? "Dispatch board" : "Live queues"}
          </h2>
          <p className="text-sm text-muted">
            {staff
              ? "Send the next free crew, and close jobs when they're fixed. Residents see the queue move."
              : "Reports are handled in request-number order."}
          </p>
        </div>
        <div className="mt-5 space-y-4">
          {c.status === "loading" && <div className="h-28 animate-pulse rounded-[26px] bg-white/5" aria-hidden="true" />}
          {active.map((sv, i) => (
            <Lane key={sv.id} service={sv} jobs={c.jobs} staff={staff} delay={i * 80} />
          ))}
          {c.status !== "loading" && active.length === 0 && <p className="text-muted">No open reports right now.</p>}
        </div>
        {staff && (
          <button type="button" onClick={lockStaff} className="mt-6 text-sm font-bold text-muted underline underline-offset-4 hover:text-ink">
            Lock the dispatch board
          </button>
        )}
      </section>

      {reporting && <ReportSheet service={reporting} jobs={c.jobs} onClose={() => setReporting(null)} />}
    </div>
  );
}

function LiveBadge({ status }: { status: "loading" | "live" | "offline" }) {
  const live = status === "live";
  return (
    <span role="status" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold ring-1 ring-line">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-support opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-support" : status === "offline" ? "bg-coral" : "bg-muted"}`} />
      </span>
      {live ? "Live · synced with every phone" : status === "offline" ? "Offline · reconnecting…" : "Connecting…"}
    </span>
  );
}

function ViewSwitch({ staff, onChange }: { staff: boolean; onChange: (v: boolean) => void }) {
  return (
    <div role="group" aria-label="View as" className="flex w-fit gap-1 rounded-full bg-white/5 p-1 text-sm ring-1 ring-line">
      {(
        [
          [false, "🏠 Resident"],
          [true, "🦺 City crew"],
        ] as const
      ).map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={staff === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-4 py-1.5 font-bold transition duration-300 ${staff === v ? "bg-ink text-night shadow-[0_0_18px_-4px_rgb(255_255_255/0.6)]" : "hover:bg-white/10"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** City staff enter a PIN once per tab before they can dispatch crews or close jobs. */
function StaffUnlock({ onCancel }: { onCancel: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  return (
    <form
      className="glass-strong window-open mx-auto mt-8 max-w-sm rounded-[28px] p-6 text-center"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await unlockStaff(value);
          toast("Dispatch board unlocked", "🦺");
        } catch (err) {
          setError(err instanceof Error ? err.message : "That didn't work.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-3xl" aria-hidden="true">
        🔐
      </p>
      <label htmlFor={id} className="mt-2 block font-display text-xl font-extrabold">
        Staff PIN
      </label>
      <p className="text-sm text-muted">Only city staff can dispatch crews and close jobs.</p>
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\s/g, "").slice(0, 32))}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="mt-4 h-12 w-full rounded-xl border border-line bg-bg px-3 text-center text-xl tracking-[0.4em] focus:border-glow focus:outline-none"
      />
      {error && (
        <p id={`${id}-err`} className="mt-2 text-sm font-bold text-coral">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-white/5 px-4 py-2.5 font-bold ring-1 ring-line hover:bg-white/10">
          Cancel
        </button>
        <button type="submit" disabled={!value || busy} className="btn-ember flex-1 rounded-full px-4 py-2.5 font-bold disabled:opacity-40">
          {busy ? "Checking…" : "Unlock"}
        </button>
      </div>
    </form>
  );
}

/** Where your report is in line, as a ticket with punched edges. */
function Ticket({ job, jobs }: { job: Job; jobs: Job[] }) {
  const sv = byId(job.service);
  const q = queueFor(jobs, sv.id);
  const position = q.waiting.findIndex((j) => j.id === job.id);
  const wait = estimateWait(sv, position, q.visiting.length);
  const steps = ["Reported", "Crew on it", "Fixed"];
  const step = job.status === "visiting" ? 1 : 0;

  return (
    <article className="ticket glass-strong relative overflow-hidden rounded-[24px]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center border-r-2 border-dashed border-line bg-[linear-gradient(160deg,rgb(255_197_110/0.25),rgb(255_143_122/0.12))] px-5 py-4">
          <span className="text-3xl" aria-hidden="true">
            {sv.emoji}
          </span>
          <span className="mt-1 font-display text-2xl font-extrabold tracking-tight">{tokenLabel(sv, job.token)}</span>
          <span className="eyebrow text-accent">Request</span>
        </div>
        <div className="min-w-0 p-4 pl-5">
          <p className="font-display text-lg font-extrabold leading-tight">{sv.label}</p>
          <p className="truncate text-sm text-muted">
            {job.location} · {job.neighborhood}
          </p>
          {job.status === "visiting" ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-support" aria-live="polite">
              <span className="on-the-way" aria-hidden="true">
                🚧
              </span>
              {job.staff} is on it now
            </p>
          ) : (
            <p className="mt-2 text-sm" aria-live="polite">
              <strong className="text-accent">
                {position === 0 ? "Next in line" : <>#<CountUp value={position + 1} duration={600} /> in line</>}
              </strong>{" "}
              · {duration(wait)}
            </p>
          )}
          <ol className="mt-3 flex items-center gap-1.5" aria-label={`Status: ${steps[step]}`}>
            {steps.map((st, i) => (
              <li key={st} className="flex flex-1 items-center gap-1.5">
                <span
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${i <= step ? "bg-gradient-to-r from-glow to-accent shadow-[0_0_8px_rgb(111_240_216/0.6)]" : "bg-white/10"}`}
                />
                <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${i <= step ? "text-ink" : "text-muted"}`}>{st}</span>
              </li>
            ))}
          </ol>
          {job.photo && <JobPhoto id={job.id} label={`Your photo of the ${sv.label.toLowerCase()} at ${job.location}`} />}
          {job.status === "queued" && (
            <button
              type="button"
              onClick={() =>
                withdraw(job.id)
                  .then(() => toast(`Withdrew ${tokenLabel(sv, job.token)}`, "↩"))
                  .catch(oops)
              }
              className="mt-3 text-xs font-bold text-muted underline underline-offset-4 hover:text-coral"
            >
              Withdraw report
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const SLOT_W = 124; // px per request in a lane

/** One service's line: crews out on jobs, then every report waiting, gliding forward as it moves. */
function Lane({ service, jobs, staff, delay }: { service: Service; jobs: Job[]; staff: boolean; delay: number }) {
  const q = queueFor(jobs, service.id);
  const nextWait = estimateWait(service, q.waiting.length, q.visiting.length);
  const freeTeam = service.team.filter((t) => !q.visiting.some((j) => j.staff === t));
  const notes = staff ? [...q.visiting, ...q.waiting].filter((j) => j.note || j.photo) : [];

  return (
    <div data-reveal className="glass rounded-[26px] p-4 sm:p-5" style={{ ["--d" as string]: `${delay}ms` }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xl" aria-hidden="true">
          {service.emoji}
        </span>
        <h3 className="font-display text-lg font-extrabold">{service.label}</h3>
        <span className="text-xs font-bold text-muted">
          {q.waiting.length} waiting · a new report now waits {duration(nextWait)}
        </span>
        {staff && (
          <button
            type="button"
            disabled={!freeTeam.length || !q.waiting.length}
            onClick={() =>
              dispatchNext(service.id)
                .then((r) => toast(`${r.staff} is heading to ${r.location}`, "🚧"))
                .catch(oops)
            }
            className="btn-ember ml-auto rounded-full px-4 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {q.waiting.length ? `Send ${freeTeam[0] ?? "next crew"} to ${q.waiting[0].location}` : "Nobody waiting"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <ul className="flex shrink-0 flex-wrap gap-2" aria-label="Crews">
          {service.team.map((t) => {
            const job = q.visiting.find((j) => j.staff === t);
            return (
              <li
                key={t}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ring-1 transition-colors duration-500 ${
                  job ? "bg-support-solid/25 ring-support/50" : "bg-white/5 ring-line"
                }`}
              >
                <span aria-hidden="true" className={job ? "on-the-way" : ""}>
                  {job ? "🚧" : "🦺"}
                </span>
                <span>
                  <span className="font-bold">{t}</span>{" "}
                  <span className={job ? "text-support" : "text-muted"}>
                    {job ? `at ${job.location}${job.mine ? " (yours)" : ""}` : "free"}
                  </span>
                </span>
                {staff && job && (
                  <button
                    type="button"
                    onClick={() =>
                      markDone(job.id)
                        .then(() => toast(`${tokenLabel(service, job.token)} fixed at ${job.location}`, "✅"))
                        .catch(oops)
                    }
                    className="ml-1 rounded-full bg-support-solid px-2.5 py-0.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
                  >
                    Fixed ✓
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <span aria-hidden="true" className="hidden text-muted md:block">
          ←
        </span>

        <div className="relative min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
          {q.waiting.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nobody waiting.</p>
          ) : (
            <ol className="relative h-12" style={{ width: q.waiting.length * SLOT_W }} aria-label={`${q.waiting.length} waiting`}>
              {q.waiting.map((j, i) => (
                <li
                  key={j.id}
                  className={`lane-token absolute left-0 top-0 flex h-12 w-28 flex-col items-center justify-center rounded-xl px-2 text-xs ring-1 ${
                    j.mine
                      ? "bg-[linear-gradient(135deg,#ffd88a,#ff9f80)] font-bold text-[#2a1204] ring-accent shadow-[0_0_20px_-4px_rgb(255_197_110/0.9)]"
                      : "bg-white/5 ring-line"
                  }`}
                  style={{ transform: `translateX(${i * SLOT_W}px)` }}
                >
                  <span className="font-extrabold">{tokenLabel(service, j.token)}</span>
                  <span className={`w-full truncate text-center ${j.mine ? "" : "text-muted"}`}>{j.mine ? "Yours" : j.neighborhood}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          {notes.map((j) => (
            <li key={j.id}>
              <strong>{tokenLabel(service, j.token)}</strong> <span className="text-muted">· {j.location}{j.note ? ":" : ""}</span> {j.note}
              {j.photo && <JobPhoto id={j.id} label={`Photo of the ${service.label.toLowerCase()} at ${j.location}`} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A window for reporting one kind of problem, which prints your request number when you're done. */
function ReportSheet({ service, jobs, onClose }: { service: Service; jobs: Job[]; onClose: () => void }) {
  const s = useStore();
  const [location, setLocation] = useState(s.location);
  const [hood, setHood] = useState<Neighborhood>(s.neighborhood ?? NEIGHBORHOODS[0]);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState("");
  const [booked, setBooked] = useState<{ id: string; token: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const ids = { location: useId(), note: useId(), err: useId() };
  const q = queueFor(jobs, service.id);
  const position = booked ? q.waiting.findIndex((j) => j.id === booked.id) : q.waiting.length;
  const wait = estimateWait(service, Math.max(0, position), q.visiting.length);
  const mine = booked && jobs.find((j) => j.id === booked.id);

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    firstRef.current?.focus();
    return () => returnTo?.focus();
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-3 pb-3 sm:items-center sm:pb-0" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div aria-hidden="true" onClick={close} className={`absolute inset-0 bg-[#010b11]/60 backdrop-blur-md ${closing ? "fade-out" : "fade-in"}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className={`glass-strong halo relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[30px] p-6 ${closing ? "palette-out" : "palette-in"}`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-line transition hover:bg-white/10"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 pr-10">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-soft text-2xl ring-1 ring-glow/30">
            {service.emoji}
          </span>
          <div>
            <h2 id="report-title" className="font-display text-2xl font-extrabold leading-tight">
              {service.label}
            </h2>
            <p className="text-xs text-muted">{service.note}</p>
          </div>
        </div>

        {booked ? (
          <div className="mt-6" role="status">
            <div className="relative overflow-hidden rounded-2xl pt-2">
              <span aria-hidden="true" className="absolute inset-x-6 top-0 h-2 rounded-full bg-black/50 shadow-[inset_0_2px_4px_rgb(0_0_0/0.8)]" />
              <div className="print ticket mx-2 rounded-2xl bg-[linear-gradient(160deg,#fff7e6,#ffe1c7)] p-5 text-center text-[#2a1204]">
                <p className="eyebrow">Request number</p>
                <p className="font-display text-6xl font-extrabold tracking-tight">{tokenLabel(service, booked.token)}</p>
                <p className="mt-1 text-sm font-bold">
                  {mine?.location ?? location} · {mine?.neighborhood ?? hood}
                </p>
                <div className="my-3 border-t-2 border-dashed border-[#2a1204]/25" />
                <p className="text-sm">
                  {position <= 0 ? "Next in line" : `#${position + 1} in line`} · <strong>{duration(wait)}</strong>
                </p>
                {photo && <p className="mt-1 text-xs font-bold">📷 Photo attached for the crew</p>}
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted">This page updates by itself when a crew is on it.</p>
            <button type="button" onClick={close} className="btn-ember mt-4 w-full rounded-full px-6 py-3 font-bold">
              Done
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (location.trim().length < 3 || busy) return;
              setBusy(true);
              setError("");
              try {
                const r = await report({ service: service.id, location: location.trim(), neighborhood: hood, note: note.trim(), photo });
                rememberLocation(location.trim());
                setBooked(r);
                toast(`Request ${tokenLabel(service, r.token)} received`, "🎟️");
              } catch (err) {
                setError(err instanceof Error ? err.message : "That didn't go through.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div>
              <label htmlFor={ids.location} className="mb-1 block text-sm font-bold">
                {COMMUNITY.locationLabel}
              </label>
              <input
                ref={firstRef}
                id={ids.location}
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 80))}
                placeholder={`e.g. ${COMMUNITY.locationExample}`}
                required
                minLength={3}
                autoComplete="street-address"
                className="h-12 w-full rounded-xl border border-line bg-bg px-3 font-bold transition-shadow focus:border-glow focus:shadow-[0_0_0_4px_rgb(111_240_216/0.12)] focus:outline-none"
              />
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-bold">Neighborhood</legend>
              <div className="grid grid-cols-2 gap-2">
                {NEIGHBORHOODS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={hood === n}
                    onClick={() => setHood(n)}
                    className={`chip-pop rounded-xl border-2 px-2 py-2 text-sm font-bold transition duration-300 ${
                      hood === n ? "border-glow bg-navy text-white shadow-[0_0_20px_-6px_rgb(111_240_216/0.8)]" : "border-line bg-white/5 hover:border-glow/50"
                    }`}
                  >
                    📍 {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor={ids.note} className="mb-1 block text-sm font-bold">
                Anything the crew should know? <span className="font-normal text-muted">(optional, only staff see it)</span>
              </label>
              <textarea
                id={ids.note}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                rows={2}
                placeholder="e.g. About a foot wide, in the right-hand lane"
                className="w-full rounded-xl border border-line bg-bg p-3 text-sm focus:border-glow focus:outline-none"
              />
            </div>
            <PhotoPicker photo={photo} onChange={setPhoto} />
            <p className="rounded-2xl bg-navy-soft p-3 text-sm ring-1 ring-glow/20">
              You&apos;ll be <strong>#{q.waiting.length + 1}</strong> in line · {duration(wait)}
            </p>
            {error && (
              <p id={ids.err} role="alert" className="text-sm font-bold text-coral">
                {error}
              </p>
            )}
            <button type="submit" disabled={location.trim().length < 3 || busy} className="btn-ember w-full rounded-full px-6 py-3 font-bold disabled:opacity-40">
              {busy ? (photo ? "Sending photo…" : "Sending…") : "Send report"} <span aria-hidden="true">🎟️</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * An optional photo of the problem. Picking one opens the camera or gallery on phones;
 * on a computer it can also be dropped in. It's shrunk on this device before sending.
 */
function PhotoPicker({ photo, onChange }: { photo: string; onChange: (dataUrl: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await shrinkPhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use that photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p id={`${id}-label`} className="mb-1 text-sm font-bold">
        Photo <span className="font-normal text-muted">(optional, only staff see it)</span>
      </p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {photo ? (
        <div className="flex items-center gap-4">
          <div className="develop shrink-0 rounded-md bg-[#fbf7ef] p-1.5 pb-5 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.8)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image */}
            <img src={photo} alt="Your photo of the problem" className="h-24 w-24 rounded-sm object-cover" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm font-bold text-support">📷 Photo added</p>
            <label htmlFor={id} className="cursor-pointer py-1 text-sm font-bold text-muted underline underline-offset-4 hover:text-ink">
              Change photo
            </label>
            <button type="button" onClick={() => onChange("")} className="py-1 text-sm font-bold text-muted underline underline-offset-4 hover:text-coral">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3 transition duration-300 focus-within:border-glow ${
            dragging ? "border-glow bg-glow/10" : "border-line bg-white/5 hover:border-glow/50"
          }`}
        >
          <span aria-hidden="true" className={`text-2xl transition-transform duration-500 ease-spring ${dragging ? "scale-125" : ""}`}>
            {busy ? "⏳" : "📷"}
          </span>
          <span className="text-sm">
            <span className="block font-bold">{busy ? "Getting your photo ready…" : "Add a photo"}</span>
            <span id={`${id}-hint`} className="block text-xs text-muted">
              Helps the crew spot it. Location data is removed.
            </span>
          </span>
        </label>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-bold text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

/** A report's photo, loaded only when someone asks to see it. */
function JobPhoto({ id, label }: { id: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const toggle = async () => {
    if (open || url) return setOpen(!open);
    setLoading(true);
    try {
      setUrl(await photoUrl(id));
      setOpen(true);
    } catch (e) {
      oops(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold ring-1 ring-line transition hover:bg-white/10"
      >
        📷 {loading ? "Loading…" : open ? "Hide photo" : "See photo"}
      </button>
      {open && url && (
        <div className="develop mt-3 w-fit max-w-full rounded-md bg-[#fbf7ef] p-1.5 pb-5 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.8)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a private photo loaded with this device's id */}
          <img src={url} alt={label} className="max-h-60 max-w-full rounded-sm object-contain" />
        </div>
      )}
    </div>
  );
}
