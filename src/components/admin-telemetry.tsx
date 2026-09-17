"use client";

import { useState } from "react";
import { radarDotsFromJobs } from "@/lib/radar-view";

export type AdminRadarJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  deadline?: Date | string | null;
};

export function AdminHudStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="hud-panel p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] hud-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs hud-muted">{hint}</p>
    </article>
  );
}

export function AdminKpiRing({
  label,
  value,
  total,
  tone = "cyan",
}: {
  label: string;
  value: number;
  total: number;
  tone?: "cyan" | "blue" | "warn";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const color = tone === "warn" ? "var(--warn)" : tone === "blue" ? "var(--hud-blue, #1a6dff)" : "var(--hud-cyan, #3dc8ff)";
  return (
    <article className="hud-panel flex items-center gap-4 p-4">
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-full hud-ring-pulse"
        style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#050a1d] text-sm font-semibold">{value}</div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] hud-muted">{label}</p>
        <p className="mt-1 text-xs hud-muted">{total ? `${pct}% of stock` : "No signals"}</p>
      </div>
    </article>
  );
}

export function AdminTelemetryRadar({ jobs }: { jobs: AdminRadarJob[] }) {
  const dots = radarDotsFromJobs(jobs);
  const [active, setActive] = useState<(typeof dots)[number] | null>(null);
  const jobById = new Map(jobs.map((job) => [job.id, job]));

  return (
    <section className="hud-panel relative overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] hud-kicker">Global telemetry</p>
          <h2 className="mt-1 text-lg font-semibold">Opportunity stock</h2>
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] hud-muted">{jobs.length} real signals</p>
      </div>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-sm">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(61,200,255,0.18)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(61,200,255,0.14)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(61,200,255,0.12)" strokeWidth="0.4" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(61,200,255,0.12)" strokeWidth="0.3" />
          <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(61,200,255,0.12)" strokeWidth="0.3" />
          <g className="hud-sweep">
            <path d="M50 50 L50 6 A44 44 0 0 1 78 18 Z" fill="url(#hudSweep)" opacity="0.55" />
          </g>
          <defs>
            <linearGradient id="hudSweep" x1="50" y1="50" x2="78" y2="10">
              <stop offset="0%" stopColor="rgba(61,200,255,0.35)" />
              <stop offset="100%" stopColor="rgba(61,200,255,0)" />
            </linearGradient>
          </defs>
        </svg>
        {jobs.length ? (
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="Admin radar of real opportunities">
            {dots.map((dot) => {
              const status = jobById.get(dot.id)?.status ?? "pending";
              const fill =
                dot.lifecycle === "closing_soon"
                  ? "var(--warn)"
                  : status === "published"
                    ? "#1a6dff"
                    : status === "pending"
                      ? "#3dc8ff"
                      : "rgba(244,247,255,0.55)";
              return (
                <a key={dot.id} href={`/admin/jobs/${dot.id}/edit`} aria-label={`${dot.title} at ${dot.company}`}>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={active?.id === dot.id ? 2.3 : 1.6}
                    fill={fill}
                    className={status === "pending" || dot.lifecycle === "closing_soon" ? "jr-dot-ping" : undefined}
                    onMouseEnter={() => setActive(dot)}
                    onMouseLeave={() => setActive(null)}
                  />
                </a>
              );
            })}
          </svg>
        ) : null}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3dc8ff] shadow-[0_0_12px_#3dc8ff]" />
        {active ? (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-xl border border-[rgba(61,200,255,0.28)] bg-[#050a1d]/90 p-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.14em] hud-muted">{active.company}</p>
            <p className="font-semibold">{active.title}</p>
          </div>
        ) : null}
      </div>
      {!jobs.length ? (
        <p className="mt-3 text-center text-sm hud-muted">No real opportunities in stock. JobRadar does not draw fake blips.</p>
      ) : (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] hud-muted">
          Cyan pending · blue published · amber closing soon
        </p>
      )}
    </section>
  );
}
