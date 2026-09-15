"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AuthClerkPanel({
  mode,
  instance,
}: {
  mode: "sign-in" | "sign-up";
  instance: "production" | "development";
}) {
  const [hint, setHint] = useState<{ url: string | null } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="clerk-js"], script[src*="clerk.browser.js"]',
      );
      setHint({ url: script?.src ?? null });
    }, 4000);
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

  const fapiHost = hint?.url ? safeHost(hint.url) : null;
  const vercelFapi = Boolean(fapiHost?.startsWith("clerk.") && fapiHost.endsWith(".vercel.app"));
  const production = instance === "production";

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <section className="panel space-y-3 p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {production ? (
          <p className="text-sm text-muted">
            Instance Clerk <strong>Production</strong> (<code>pk_live_</code>). Le widget charge le Frontend API via{" "}
            <code>/__clerk</code> — JobRadar ne remplace pas ces clés par <code>pk_test_</code>.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Instance Clerk <strong>Development</strong> (<code>pk_test_</code>). Le Frontend API est{" "}
            <code>*.clerk.accounts.dev</code>. Le proxy <code>/__clerk</code> est <strong>désactivé</strong> ici : Clerk
            indique que le proxy ne fonctionne pas sur une instance Development (ce qui casserait Sign In sur{" "}
            <code>*.vercel.app</code>).
          </p>
        )}
        {other}
      </section>
      <ClerkLoading>
        <div className="panel min-h-[280px] p-6 text-sm text-muted">Chargement du formulaire de compte…</div>
        {hint ? (
          <section className="panel mt-5 space-y-3 p-6 text-sm">
            <h2 className="font-semibold">
              {production ? "Clerk Production n’a pas fini de charger" : "Clerk Development n’a pas fini de charger"}
            </h2>
            {production && vercelFapi ? (
              <>
                <p>
                  La <code>pk_live_</code> pointe encore vers <code>{fapiHost}</code>, qui n&apos;a pas de HTTPS. Ce
                  n&apos;est pas un problème de clés test : Clerk Production n&apos;accepte pas <code>*.vercel.app</code>{" "}
                  comme domaine DNS.
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-muted">
                  <li>
                    Gardez les clés <code>pk_live_</code> / <code>sk_live_</code> (ne les remplacez pas par{" "}
                    <code>pk_test_</code>).
                  </li>
                  <li>
                    Ajoutez <strong>un domaine que vous possédez</strong> dans Vercel, puis dans Clerk → Configure →
                    Domains.
                  </li>
                  <li>
                    Checklist Clerk : <strong>Configure app proxy /__clerk</strong> →{" "}
                    <code>https://votre-domaine/__clerk</code> (cette app expose déjà cette route).
                  </li>
                  <li>
                    Set environment variables : <code>NEXT_PUBLIC_APP_URL=https://votre-domaine</code> et{" "}
                    <code>NEXT_PUBLIC_CLERK_PROXY_URL=https://votre-domaine/__clerk</code> dans Vercel, puis Redeploy.
                  </li>
                  <li>Create your first user in production : Sign Up sur ce domaine, pas sur le Dashboard Clerk.</li>
                </ol>
              </>
            ) : (
              <p className="text-muted">
                Script Clerk : <code className="break-all">{hint.url ?? "introuvable"}</code>
                {production
                  ? ". Vérifiez le proxy /__clerk dans Clerk Dashboard et que le domaine Production est le vôtre."
                  : ". En Development le widget doit parler à *.clerk.accounts.dev. Si NEXT_PUBLIC_CLERK_PROXY_URL est défini sur Vercel, retirez-le."}
              </p>
            )}
          </section>
        ) : null}
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

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
