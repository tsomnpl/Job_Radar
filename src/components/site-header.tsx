"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { JobRadarLogo } from "@/components/brand";

const LINKS = [
  { href: "/search", label: "Recherche" },
  { href: "/jobs", label: "Offres" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cv", label: "CV" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader({ clerkEnabled, demo }: { clerkEnabled: boolean; demo: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1c3a4d] bg-[#07111a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <JobRadarLogo />
        <nav className="hidden items-center gap-5 text-sm text-[#b9d4d4] md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#2ee6d6]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {demo ? (
            <span className="rounded-full border border-[#14685f] px-3 py-1 text-xs text-[#2ee6d6]">
              Mode démo
            </span>
          ) : null}
          {clerkEnabled ? (
            <>
              <SignedOut>
                <Link href="/sign-in" className="hover:text-[#2ee6d6]">
                  Connexion
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-[#2ee6d6] px-3 py-1.5 font-medium text-[#07111a]"
                >
                  Inscription
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <Link href="/dashboard" className="rounded-full bg-[#2ee6d6] px-3 py-1.5 font-medium text-[#07111a]">
              Ouvrir le radar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
