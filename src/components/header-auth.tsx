"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { t, type AppLang } from "@/i18n/messages";

export function HeaderAuth({
  clerkEnabled,
  lang = "fr",
  variant = "bar",
}: {
  clerkEnabled: boolean;
  lang?: AppLang;
  variant?: "bar" | "menu";
}) {
  const pathname = usePathname() || "/dashboard";
  const redirectUrl = pathname.startsWith("/sign-") ? "/dashboard" : pathname;

  if (!clerkEnabled) {
    return (
      <Link href="/dashboard" className="btn-primary rounded-full px-3 py-1.5 font-medium whitespace-nowrap">
        {t(lang, "nav.openRadar")}
      </Link>
    );
  }

  if (variant === "menu") {
    return (
      <div className="flex flex-col gap-2 pt-2">
        <SignedOut>
          <SignInButton mode="redirect" forceRedirectUrl={redirectUrl}>
            <button type="button" className="py-1 text-left hover:text-accent">
              {t(lang, "nav.signIn")}
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl={redirectUrl}>
            <button type="button" className="btn-primary w-fit rounded-full px-3 py-1.5 font-medium">
              {t(lang, "nav.signUp")}
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="py-1 hover:text-accent">
            {t(lang, "nav.account")}
          </Link>
          <SignOutButton redirectUrl="/">
            <button type="button" className="py-1 text-left hover:text-accent">
              {t(lang, "nav.signOut")}
            </button>
          </SignOutButton>
        </SignedIn>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <span className="hidden items-center gap-2 sm:inline-flex">
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
        </span>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 min-h-8 min-w-8",
              userButtonBox: "flex items-center",
              userButtonTrigger: "rounded-full focus:shadow-none",
            },
          }}
        />
      </SignedIn>
    </>
  );
}
