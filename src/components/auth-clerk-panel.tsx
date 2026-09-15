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
  const [hint, setHint] = useState<{ url: string | null; unreachable: boolean } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="clerk-js"], script[src*="clerk.browser.js"]',
      );
      const src = script?.src ?? null;
      if (!src) {
        setHint({ url: null, unreachable: true });
        return;
      }
      const controller = new AbortController();
      fetch(src, { method: "GET", mode: "no-cors", signal: controller.signal })
        .then(() => setHint({ url: src, unreachable: false }))
        .catch(() => setHint({ url: src, unreachable: true }));
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

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <section className="panel space-y-3 p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted">
          Les clés Clerk sont bien sur Vercel. Le formulaire se charge depuis le Frontend API Clerk — s&apos;il reste
          vide, ce n&apos;est pas un `.env` manquant.
        </p>
        {other}
      </section>
      <ClerkLoading>
        <div className="panel min-h-[280px] p-6 text-sm text-muted">Chargement du formulaire de compte…</div>
        {hint ? (
          <section className="panel mt-5 space-y-3 p-6 text-sm">
            <h2 className="font-semibold">Clerk ne charge pas le widget</h2>
            {vercelFapi ? (
              <>
                <p>
                  La clé <code>pk_live_</code> pointe le Frontend API vers <code>{fapiHost}</code>. Ce sous-domaine
                  n&apos;a pas de HTTPS valide — tu ne peux pas créer <code>clerk.*.vercel.app</code> (Vercel gère le
                  DNS).
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-muted">
                  <li>
                    Ouvre{" "}
                    <a className="text-accent" href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
                      Clerk Dashboard
                    </a>{" "}
                    → Configure → Domains.
                  </li>
                  <li>
                    N&apos;utilise <strong>pas</strong> <code>job-radar-six-ochre.vercel.app</code> comme domaine
                    Frontend API.
                  </li>
                  <li>
                    Le plus simple : instance <strong>Development</strong> (<code>pk_test_</code> /{" "}
                    <code>sk_test_</code>) dont l&apos;API est <code>*.clerk.accounts.dev</code>.
                  </li>
                  <li>
                    Ajoute <code>https://job-radar-six-ochre.vercel.app</code> seulement en Allowed origin / Redirect
                    URLs.
                  </li>
                  <li>Colle les nouvelles clés dans Vercel → Environment Variables, puis Redeploy.</li>
                </ol>
              </>
            ) : (
              <p className="text-muted">
                Script Clerk : <code className="break-all">{hint.url ?? "introuvable"}</code>. Vérifie Allowed origins
                dans Clerk et que <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> / <code>CLERK_SECRET_KEY</code> sont
                le même couple.
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
