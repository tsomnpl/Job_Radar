"use client";

import Link from "next/link";
import { useState } from "react";
import { JobRadarLogo } from "@/components/brand";
import { HeaderAuth } from "@/components/header-auth";
import { ThemeToggle } from "@/components/theme-toggle";

type HeaderLink = { href: string; label: string };

export function SiteHeader({
  clerkEnabled,
  signedIn,
  isAdmin,
}: {
  clerkEnabled: boolean;
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const links: HeaderLink[] = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search" },
    { href: "/jobs", label: "Jobs" },
  ];
  if (signedIn || !clerkEnabled) {
    links.push(
      { href: "/dashboard", label: "Dashboard" },
      { href: "/cv", label: "CV" },
      { href: "/saved-jobs", label: "Saved Jobs" },
      { href: "/applications", label: "Applications" },
    );
  }
  if (isAdmin) links.push({ href: "/admin", label: "Admin" });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--header)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <JobRadarLogo />
        <nav className="hidden flex-wrap items-center justify-center gap-5 text-sm text-muted lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          <HeaderAuth clerkEnabled={clerkEnabled} />
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-xs lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <nav className="flex flex-col gap-2 border-t border-line px-4 py-3 text-sm lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="py-1 hover:text-accent" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
