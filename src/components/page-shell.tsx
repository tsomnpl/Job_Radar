"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function PageSkeleton({ title = "Chargement du radar…" }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted">Les données arrivent…</p>
      </div>
      <div className="panel h-40 animate-pulse bg-elev" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel h-28 animate-pulse bg-elev" />
        <div className="panel h-28 animate-pulse bg-elev" />
        <div className="panel h-28 animate-pulse bg-elev" />
      </div>
    </div>
  );
}

export function AuthCallout({
  next = "/dashboard",
  clerkEnabled,
}: {
  next?: string;
  clerkEnabled: boolean;
}) {
  if (!clerkEnabled) return null;
  return <ClerkAuthCallout next={next} />;
}

function ClerkAuthCallout({ next }: { next: string }) {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) return null;

  return (
    <section className="panel space-y-3 p-5">
      <h2 className="font-semibold">Connectez-vous pour enregistrer</h2>
      <p className="text-sm text-muted">
        Un compte est nécessaire pour sauvegarder vos offres, votre CV et vos candidatures.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(next)}`}
          className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
        >
          Connexion
        </Link>
        <Link
          href={`/sign-up?redirect_url=${encodeURIComponent(next)}`}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
        >
          Créer un compte
        </Link>
      </div>
    </section>
  );
}
