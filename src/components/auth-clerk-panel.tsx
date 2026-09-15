"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AuthClerkPanel({
  mode,
}: {
  mode: "sign-in" | "sign-up";
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const title = mode === "sign-in" ? "Connexion" : "Créer un compte";
  const other =
    mode === "sign-in" ? (
      <Link href="/sign-up" className="text-accent">
        Pas de compte ? Inscription
      </Link>
    ) : (
      <Link href="/sign-in" className="text-accent">
        Déjà un compte ? Connexion
      </Link>
    );

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <section className="panel space-y-3 p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted">
          JobRadar affiche toujours cet écran. Le formulaire Clerk se charge en dessous — s&apos;il reste vide, le
          domaine Vercel n&apos;est peut-être pas autorisé dans Clerk.
        </p>
        {other}
      </section>
      <ClerkLoading>
        <div className="panel min-h-[420px] p-6 text-sm text-muted">Chargement du formulaire de compte…</div>
      </ClerkLoading>
      <ClerkLoaded>
        <div className="flex min-h-[420px] justify-center">
          {mode === "sign-in" ? (
            <SignIn
              appearance={clerkAppearance}
              routing="path"
              path="/sign-in"
              fallbackRedirectUrl="/dashboard"
            />
          ) : (
            <SignUp
              appearance={clerkAppearance}
              routing="path"
              path="/sign-up"
              fallbackRedirectUrl="/dashboard"
            />
          )}
        </div>
      </ClerkLoaded>
      {slow ? (
        <p className="text-center text-sm text-muted">
          Toujours vide ? Ouvrez{" "}
          <a className="text-accent" href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
            Clerk Dashboard
          </a>{" "}
          et ajoutez <code>job-radar-six-ochre.vercel.app</code> aux origines autorisées.
        </p>
      ) : null}
      <p className="text-center text-sm">
        <Link href="/" className="text-accent">
          Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
