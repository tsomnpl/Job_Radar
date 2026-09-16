"use client";

import { useId, type ReactNode } from "react";

export function RadarDish({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const glow = `${uid}-glow`;
  const sweep = `${uid}-sweep`;
  return (
    <svg viewBox="0 0 100 100" className={`jr-dish text-accent ${className}`} aria-hidden>
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="65%" stopColor="currentColor" stopOpacity="0.05" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={sweep} x1="50" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${glow})`} />
      <g className="jr-breathe-g">
        <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.45" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.55" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="0.45" opacity="0.65" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.18" opacity="0.28" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.18" opacity="0.28" />
      </g>
      <g className="jr-sweep-g">
        <path d="M50 50 L98 50 A48 48 0 0 0 50 2 Z" fill={`url(#${sweep})`} />
      </g>
      <circle className="jr-wave" cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="0.85" />
      <circle
        className="jr-wave"
        cx="50"
        cy="50"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.85"
        style={{ animationDelay: "1.4s" }}
      />
      <circle
        className="jr-wave"
        cx="50"
        cy="50"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.85"
        style={{ animationDelay: "2.8s" }}
      />
      <circle className="jr-core" cx="50" cy="50" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function LandingRadar({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden md:hidden" aria-hidden>
        <RadarDish className="absolute -bottom-16 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 opacity-40" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-[-8%] hidden w-[50%] items-center md:flex" aria-hidden>
        <div className="relative mx-auto aspect-square w-full max-w-[36rem]">
          <RadarDish className="absolute inset-0 h-full w-full" />
          {children}
        </div>
      </div>
    </>
  );
}
