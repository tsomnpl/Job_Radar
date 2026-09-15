"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { JobRadarLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/search", label: "Recherche" },
  { href: "/jobs", label: "Offres" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cv", label: "CV" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader({ clerkEnabled, demo }: { clerkEnabled: boolean; demo: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--header)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <JobRadarLogo />
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
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
          {clerkEnabled ? (
            <>
              <SignedOut>
                <Link href="/sign-in" className="hover:text-accent">
                  Connexion
                </Link>
                <Link href="/sign-up" className="btn-primary rounded-full px-3 py-1.5 font-medium">
                  Inscription
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <Link href="/dashboard" className="btn-primary rounded-full px-3 py-1.5 font-medium">
              Ouvrir le radar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
