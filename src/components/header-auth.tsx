"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export function HeaderAuth({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return (
      <Link href="/dashboard" className="btn-primary rounded-full px-3 py-1.5 font-medium">
        Ouvrir le radar
      </Link>
    );
  }
  return <ClerkHeaderAuth />;
}

function ClerkHeaderAuth() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) {
    return <UserButton />;
  }
  return (
    <>
      <Link href="/sign-in" className="hover:text-accent">
        Connexion
      </Link>
      <Link href="/sign-up" className="btn-primary rounded-full px-3 py-1.5 font-medium">
        Inscription
      </Link>
    </>
  );
}
