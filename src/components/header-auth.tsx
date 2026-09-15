"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function HeaderAuth({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return (
      <Link href="/dashboard" className="btn-primary rounded-full px-3 py-1.5 font-medium">
        Ouvrir le radar
      </Link>
    );
  }
  return (
    <>
      <SignedOut>
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <button type="button" className="hover:text-accent">
            Connexion
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
          <button type="button" className="btn-primary rounded-full px-3 py-1.5 font-medium">
            Inscription
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
