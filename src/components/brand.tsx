import type { ReactNode } from "react";
import Link from "next/link";

export function RadarMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#0c1b27" stroke="#2ee6d6" strokeWidth="2" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#2ee6d6" strokeOpacity="0.45" />
      <circle cx="24" cy="24" r="7" fill="none" stroke="#2ee6d6" strokeOpacity="0.7" />
      <path d="M24 24 L24 4 A20 20 0 0 1 41 31 Z" fill="#2ee6d6" fillOpacity="0.22" />
      <circle cx="24" cy="24" r="2.5" fill="#2ee6d6" />
    </svg>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 75 ? "#5be3a3" : clamped >= 50 ? "#f5c14a" : "#ff7a7a";
  return (
    <div
      className="grid h-14 w-14 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${clamped * 3.6}deg, #173445 0deg)`,
      }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#07111a] text-sm font-semibold">
        {clamped}
      </div>
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#1c3a4d] bg-[#0c1b27] px-2.5 py-1 text-xs text-[#b9d4d4]">
      {children}
    </span>
  );
}

export function JobRadarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <RadarMark />
      <span>
        JobRadar
        <span className="ml-2 text-xs font-normal text-[#8eacb0]">Opportunity Intelligence</span>
      </span>
    </Link>
  );
}
