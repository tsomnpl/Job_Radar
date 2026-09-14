import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 75 ? "var(--good)" : clamped >= 50 ? "var(--warn)" : "var(--danger)";
  return (
    <div
      className="grid h-14 w-14 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${clamped * 3.6}deg, var(--ring-track) 0deg)`,
      }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-elev text-sm font-semibold">
        {clamped}
      </div>
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-elev px-2.5 py-1 text-xs text-muted">{children}</span>
  );
}

export function JobRadarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/brand/jobradar-mark.png"
        alt="JobRadar"
        width={40}
        height={40}
        className="rounded-xl"
        priority
      />
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight">
          Job<span className="text-accent">Radar</span>
        </span>
        <span className="hidden text-[11px] font-normal text-muted sm:block">Your next opportunity</span>
      </span>
    </Link>
  );
}
