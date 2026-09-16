import "server-only";

import { createClerkClient } from "@clerk/nextjs/server";
import {
  appUrl,
  clerkAuthorizedParties,
  clerkClientProxyUrl,
  clerkKeysAligned,
  clerkProxyEnvSet,
  clerkProxyUrl,
  clerkPublishableKind,
  clerkSecretKind,
  isClerkConfigured,
  isClerkProduction,
  isVercelAppHost,
} from "@/lib/env";
import { withTimeout } from "@/lib/timeout";

export type ClerkChecklistItem = {
  id: "env" | "first_user" | "proxy";
  title: string;
  done: boolean;
  detail: string;
};

export type ClerkInstanceStatus = {
  configured: boolean;
  instance: "production" | "development" | "none";
  publishableKind: ReturnType<typeof clerkPublishableKind>;
  secretKind: ReturnType<typeof clerkSecretKind>;
  keysPresent: boolean;
  keysAligned: boolean;
  developmentAuthUsable: boolean;
  productionReady: boolean;
  proxyEnabledInApp: boolean;
  proxyUrl: string | null;
  proxyRoute: "/__clerk";
  appUrl: string;
  vercelAppHost: boolean;
  authorizedParties: string[];
  inspected: boolean;
  domainName: string | null;
  frontendApiUrl: string | null;
  dashboardProxyUrl: string | null;
  userCount: number | null;
  checklist: ClerkChecklistItem[];
  blockers: string[];
};

type ClerkRemote = {
  domainName: string | null;
  frontendApiUrl: string | null;
  dashboardProxyUrl: string | null;
  userCount: number;
};

async function inspectClerkRemote(): Promise<ClerkRemote | null> {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) return null;

  const clerk = createClerkClient({ secretKey: secret });
  const remote = await withTimeout(
    Promise.all([clerk.users.getUserList({ limit: 1 }), clerk.domains.list()]).then(([users, domains]) => {
      const primary = domains.data.find((domain) => !domain.isSatellite) ?? domains.data[0];
      return {
        domainName: primary?.name ?? null,
        frontendApiUrl: primary?.frontendApiUrl ?? null,
        dashboardProxyUrl: primary?.proxyUrl ?? null,
        userCount: users.totalCount,
      } satisfies ClerkRemote;
    }),
    4000,
    null,
  );
  return remote;
}

export async function clerkInstanceStatus(): Promise<ClerkInstanceStatus> {
  const kind = clerkPublishableKind();
  const secretKind = clerkSecretKind();
  const vercelHost = isVercelAppHost();
  const configured = isClerkConfigured();
  const aligned = clerkKeysAligned();
  const production = isClerkProduction();
  const proxyUrl = clerkProxyUrl();
  const proxyEnvOnDevelopment = !production && clerkProxyEnvSet();
  const remote = configured ? await inspectClerkRemote() : null;

  const domainLooksVercelApp = Boolean(
    remote?.domainName?.endsWith(".vercel.app") || remote?.frontendApiUrl?.includes(".vercel.app"),
  );
  const dashboardProxyOk = Boolean(remote?.dashboardProxyUrl?.includes("/__clerk"));
  const ownedDomain = production && !vercelHost && !domainLooksVercelApp;

  const envItem: ClerkChecklistItem = !configured
    ? {
        id: "env",
        title: "Set up environment variables",
        done: false,
        detail: "Clerk keys missing (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY).",
      }
    : production
      ? {
          id: "env",
          title: "Set up environment variables",
          done: aligned && !vercelHost,
          detail: !aligned
            ? "Publishable key is pk_live_ but the secret is not sk_live_ (or the reverse). Keep the Production pair together — do not substitute pk_test_."
            : vercelHost
              ? `NEXT_PUBLIC_APP_URL is still ${appUrl()}. Clerk Production cannot use *.vercel.app as its DNS/Frontend API domain. Point Vercel + Clerk at a domain you own, then set NEXT_PUBLIC_APP_URL and (only then) NEXT_PUBLIC_CLERK_PROXY_URL.`
              : "Production keys are present and APP_URL is not a vercel.app host.",
        }
      : {
          id: "env",
          title: "Set up environment variables",
          done: false,
          detail:
            "Development keys (pk_test_/sk_test_) are set. That is valid for Clerk Development on *.vercel.app. The Production checklist still needs the existing pk_live_/sk_live_ pair plus a domain you own — JobRadar will not replace live keys with test keys.",
        };

  const firstUserItem: ClerkChecklistItem = !configured
    ? {
        id: "first_user",
        title: "Create your first user in production",
        done: false,
        detail:
          "Impossible tant que Clerk n’est pas configuré. Le premier utilisateur Production se crée via Sign Up sur le domaine que tu possèdes, après pk_live_ — pas dans le Dashboard seul.",
      }
    : production
      ? {
          id: "first_user",
          title: "Create your first user in production",
          done: Boolean(remote && remote.userCount > 0),
          detail: !remote
            ? "Could not inspect Clerk users (API timeout or secret rejected). Create the first Production user via Sign Up on the owned domain — not only in the Clerk Dashboard."
            : remote.userCount > 0
              ? `Clerk Production reports ${remote.userCount} user${remote.userCount === 1 ? "" : "s"}.`
              : "No Production user yet. Sign Up on the owned domain (Sign In → Dashboard → Apply).",
        }
      : {
          id: "first_user",
          title: "Create your first user in production",
          done: false,
          detail:
            "This instance is Clerk Development. A Development account on *.vercel.app is not a Production user. After the owned domain + pk_live_, create the first Production user via Sign Up on that domain.",
        };

  const proxyItem: ClerkChecklistItem = !configured
    ? {
        id: "proxy",
        title: "Configure app proxy /__clerk",
        done: false,
        detail:
          "La route /__clerk existe dans le repo. Elle reste inactive tant qu’il n’y a pas de pk_live_ (docs Clerk : le proxy ne fonctionne pas sur une instance Development).",
      }
    : production
      ? {
          id: "proxy",
          title: "Configure app proxy /__clerk",
          done: Boolean(ownedDomain && dashboardProxyOk && clerkClientProxyUrl()),
          detail: !ownedDomain
            ? "Route GET/POST /__clerk/* exists in the app (SDK 6.39.6 has no frontendApiProxy helper). Enable it in Clerk Dashboard → Domains → Set proxy configuration → https://<votre-domaine>/__clerk after DNS is a domain you own. Clerk does not accept *.vercel.app here."
            : !dashboardProxyOk
              ? `App proxy route is live. Clerk Dashboard proxy_url is ${remote?.dashboardProxyUrl ?? "unset"}. Set it to https://<votre-domaine>/__clerk (Clerk docs: proxying is Production-only).`
              : "Dashboard proxy URL includes /__clerk and the app sends proxyUrl only because this is pk_live_.",
        }
      : {
          id: "proxy",
          title: "Configure app proxy /__clerk",
          done: false,
          detail: proxyEnvOnDevelopment
            ? "NEXT_PUBLIC_CLERK_PROXY_URL is set while using pk_test_. Clerk: proxying does not work on development instances — unset that variable on Vercel or Sign In will break."
            : "Proxy /__clerk is implemented but disabled while pk_test_ is in use, so Development login on *.vercel.app keeps using *.clerk.accounts.dev. Enable the Dashboard proxy only after switching the deployment to pk_live_ on a domain you own.",
        };

  const checklist = [envItem, firstUserItem, proxyItem];
  const developmentAuthUsable = configured && kind === "pk_test" && aligned && !proxyEnvOnDevelopment;
  const productionReady = checklist.every((item) => item.done);

  const blockers = [
    !configured ? "Clerk keys missing (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY)." : null,
    configured && !aligned
      ? "Publishable and secret keys are not the same instance (pk_live_ must pair with sk_live_, pk_test_ with sk_test_)."
      : null,
    proxyEnvOnDevelopment
      ? "NEXT_PUBLIC_CLERK_PROXY_URL is set on a Development instance. Unset it; proxying does not work with pk_test_."
      : null,
    production && vercelHost
      ? "Clerk Production cannot use *.vercel.app as its DNS/Frontend API domain. Point Clerk + Vercel at a domain you own, then set the Dashboard proxy to https://<votre-domaine>/__clerk."
      : null,
    kind === "pk_test"
      ? "Current deployment is Clerk Development (usable). Production Sign In/Up still needs the existing pk_live_ pair plus a domain you own — do not swap live keys for test keys."
      : null,
  ].filter((item): item is string => Boolean(item));

  return {
    configured,
    instance: kind === "pk_live" ? "production" : kind === "pk_test" ? "development" : "none",
    publishableKind: kind,
    secretKind,
    keysPresent: configured,
    keysAligned: aligned,
    developmentAuthUsable,
    productionReady,
    proxyEnabledInApp: Boolean(clerkClientProxyUrl()),
    proxyUrl,
    proxyRoute: "/__clerk",
    appUrl: appUrl(),
    vercelAppHost: vercelHost,
    authorizedParties: clerkAuthorizedParties(),
    inspected: Boolean(remote),
    domainName: remote?.domainName ?? null,
    frontendApiUrl: remote?.frontendApiUrl ?? null,
    dashboardProxyUrl: remote?.dashboardProxyUrl ?? null,
    userCount: remote?.userCount ?? null,
    checklist,
    blockers,
  };
}
