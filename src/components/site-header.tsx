"use client";

import Link from "next/link";
import { JobRadarLogo } from "@/components/brand";
import { HeaderAuth } from "@/components/header-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/search", label: "Recherche" },
  { href: "/jobs", label: "Offres" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/saved-jobs", label: "Radar" },
  { href: "/cv", label: "CV" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader({ clerkEnabled, demo }: { clerkEnabled: boolean; demo: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--header)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <JobRadarLogo />
        <nav className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted md:gap-5">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {demo ? (
            <span className="rounded-full border border-line px-3 py-1 text-xs text-accent">Mode démo</span>
          ) : null}
          <ThemeToggle />
          <HeaderAuth clerkEnabled={clerkEnabled} />
        </div>
      </div>
    </header>
  );
}
