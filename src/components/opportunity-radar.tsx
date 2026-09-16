"use client";

import { useState } from "react";
import { radarDotsFromJobs, type RadarDot } from "@/lib/radar-view";

export type RadarJobInput = {
  id: string;
  title: string;
  company: string;
  deadline?: Date | string | null;
  match?: { score: number };
};

export function OpportunityRadar({ jobs }: { jobs: RadarJobInput[] }) {
  const dots = radarDotsFromJobs(jobs);
  const [active, setActive] = useState<RadarDot | null>(null);

  if (!jobs.length) {
    return (
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Opportunity Radar</p>
        <p className="mt-3 font-semibold">No opportunities detected.</p>
        <p className="mt-2 text-sm text-muted">
          Aucune opportunité réelle n&apos;est actuellement détectée. JobRadar n&apos;affiche pas de points fictifs.
        </p>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Opportunity Radar</p>
          <h2 className="mt-1 text-lg font-semibold">{jobs.length} opportunités réelles</h2>
        </div>
        <p className="max-w-[12rem] text-right text-xs text-muted">Hover ou focus un point. Clic pour ouvrir.</p>
      </div>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Radar des opportunités réelles">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-[var(--line)]" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" className="text-[var(--line)]" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" className="text-[var(--line)]" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="radar-pulse text-accent" strokeWidth="0.35" />
          {dots.map((dot) => (
            <a key={dot.id} href={`/jobs/${dot.id}`} aria-label={`${dot.title} at ${dot.company}`}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={active?.id === dot.id ? 2.4 : 1.7}
                className={
                  dot.lifecycle === "closing_soon"
                    ? "fill-[var(--warn)]"
                    : dot.lifecycle === "expired"
                      ? "fill-[var(--danger)]"
                      : "fill-accent"
                }
                onMouseEnter={() => setActive(dot)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(dot)}
                onBlur={() => setActive(null)}
              />
            </a>
          ))}
        </svg>
        {active ? (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-line bg-elev/95 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{active.company}</p>
            <p className="font-semibold">{active.title}</p>
            {typeof active.score === "number" ? <p className="text-xs text-muted">{active.score}% match algorithmique</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
