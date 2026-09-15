"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AuthClerkPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
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
          {mode === "sign-in"
            ? "Accédez à votre radar, vos candidatures et votre CV."
            : "Créez un compte pour enregistrer votre profil et suivre les opportunités."}
        </p>
        {other}
      </section>
      <ClerkLoading>
        <div className="panel min-h-[280px] p-6 text-sm text-muted">Chargement…</div>
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
      <p className="text-center text-sm">
        <Link href="/" className="text-accent">
          Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
