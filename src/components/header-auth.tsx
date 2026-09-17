"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { t, type AppLang } from "@/i18n/messages";

export function HeaderAuth({ clerkEnabled, lang = "fr" }: { clerkEnabled: boolean; lang?: AppLang }) {
  const pathname = usePathname() || "/dashboard";
  const redirectUrl = pathname.startsWith("/sign-") ? "/dashboard" : pathname;

  if (!clerkEnabled) {
    return (
      <Link href="/dashboard" className="btn-primary rounded-full px-3 py-1.5 font-medium whitespace-nowrap">
        {t(lang, "nav.openRadar")}
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <SignInButton mode="redirect" forceRedirectUrl={redirectUrl}>
          <button type="button" className="hover:text-accent">
            {t(lang, "nav.signIn")}
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl={redirectUrl}>
          <button type="button" className="btn-primary rounded-full px-3 py-1.5 font-medium">
            {t(lang, "nav.signUp")}
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
