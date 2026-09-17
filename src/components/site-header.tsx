"use client";

import Link from "next/link";
import { useState } from "react";
import { JobRadarLogo } from "@/components/brand";
import { HeaderAuth } from "@/components/header-auth";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { t, type AppLang } from "@/i18n/messages";

type HeaderLink = { href: string; label: string };

export function SiteHeader({
  clerkEnabled,
  signedIn,
  isAdmin,
  lang = "fr",
}: {
  clerkEnabled: boolean;
  signedIn: boolean;
  isAdmin: boolean;
  lang?: AppLang;
}) {
  const [open, setOpen] = useState(false);
  const links: HeaderLink[] = [
    { href: "/", label: t(lang, "nav.home") },
    { href: "/search", label: t(lang, "nav.search") },
    { href: "/jobs", label: t(lang, "nav.jobs") },
  ];
  if (signedIn || !clerkEnabled) {
    links.push(
      { href: "/dashboard", label: t(lang, "nav.dashboard") },
      { href: "/cv", label: t(lang, "nav.cv") },
      { href: "/saved-jobs", label: t(lang, "nav.saved") },
      { href: "/applications", label: t(lang, "nav.applications") },
    );
  }
  if (isAdmin) links.push({ href: "/admin", label: t(lang, "nav.admin") });

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
        <div className="flex min-w-0 shrink-0 items-center gap-2 text-sm">
          <LanguageSwitch lang={lang} />
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-xs text-muted"
            onClick={() => window.dispatchEvent(new Event("jobradar-command"))}
            aria-label={t(lang, "nav.command")}
          >
            ⌘K
          </button>
          <ThemeToggle />
          <span className="hidden sm:inline-flex">
            <HeaderAuth clerkEnabled={clerkEnabled} lang={lang} />
          </span>
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-xs lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={t(lang, "nav.menu")}
          >
            {t(lang, "nav.menu")}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="flex flex-col gap-2 border-t border-line px-4 py-3 text-sm lg:hidden overflow-x-hidden">
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
