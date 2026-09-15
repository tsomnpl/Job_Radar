import { currentUser } from "@clerk/nextjs/server";
import { adminEmail, isClerkConfigured, isConfiguredAdmin } from "@/lib/env";
import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/timeout";

export const DEMO_CLERK_ID = "demo_local_user";

export type AppUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  isDemo: boolean;
};

const EPHEMERAL_DEMO: AppUser = {
  id: "ephemeral_demo",
  clerkUserId: DEMO_CLERK_ID,
  email: "demo@jobradar.local",
  name: "Profil local",
  role: "USER",
  isDemo: true,
};

function roleFor(input: {
  email?: string | null;
  verifiedEmails?: string[];
  clerkUserId?: string | null;
}): "USER" | "ADMIN" {
  return isConfiguredAdmin(input) ? "ADMIN" : "USER";
}

function ephemeralFromClerk(input: {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
}): AppUser {
  return {
    id: `ephemeral_${input.clerkUserId}`,
    clerkUserId: input.clerkUserId,
    email: input.email,
    name: input.name,
    role: input.role,
    isDemo: false,
  };
}

function toAppUser(user: {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: string;
}): AppUser {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    isDemo: user.clerkUserId === DEMO_CLERK_ID,
  };
}

function clerkEmails(clerkUser: {
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
    verification?: { status?: string | null } | null;
  }[];
}): { primary: string | null; verified: string[] } {
  const addresses = clerkUser.emailAddresses ?? [];
  const verified = addresses
    .filter((item) => item.verification?.status === "verified")
    .map((item) => item.emailAddress);
  const primary =
    addresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    addresses[0]?.emailAddress ??
    null;
  return { primary, verified };
}

async function upsertAppUser(input: {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  verifiedEmails?: string[];
}): Promise<AppUser> {
  const existing = await prisma.user.findUnique({ where: { clerkUserId: input.clerkUserId } });
  const role = roleFor({
    verifiedEmails: input.verifiedEmails,
    clerkUserId: input.clerkUserId,
  });

  const user = await prisma.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    update: {
      email: input.email ?? existing?.email,
      name: input.name ?? existing?.name,
      role,
    },
    create: {
      clerkUserId: input.clerkUserId,
      email: input.email,
      name: input.name,
      role,
    },
  });

  return toAppUser(user);
}

export async function getDemoUser(): Promise<AppUser> {
  const role = roleFor({
    verifiedEmails: ["demo@jobradar.local"],
    clerkUserId: DEMO_CLERK_ID,
  });
  try {
    return await withTimeout(
      upsertAppUser({
        clerkUserId: DEMO_CLERK_ID,
        email: "demo@jobradar.local",
        name: "Profil local",
        verifiedEmails: ["demo@jobradar.local"],
      }),
      2500,
      { ...EPHEMERAL_DEMO, role },
    );
  } catch (error) {
    logDbError("getDemoUser", error);
    return { ...EPHEMERAL_DEMO, role };
  }
}

export async function getSessionUser(): Promise<AppUser | null> {
  try {
    if (!isClerkConfigured()) {
      return getDemoUser();
    }

    const clerkUser = await withTimeout(currentUser(), 2500, null);
    if (!clerkUser) return null;

    const { primary, verified } = clerkEmails(clerkUser);
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;
    const role = roleFor({
      verifiedEmails: verified,
      clerkUserId: clerkUser.id,
    });

    try {
      return await withTimeout(
        upsertAppUser({
          clerkUserId: clerkUser.id,
          email: primary,
          name,
          verifiedEmails: verified,
        }),
        2500,
        ephemeralFromClerk({ clerkUserId: clerkUser.id, email: primary, name, role }),
      );
    } catch (error) {
      logDbError("upsertAppUser", error);
      return ephemeralFromClerk({ clerkUserId: clerkUser.id, email: primary, name, role });
    }
  } catch (error) {
    logDbError("getSessionUser", error);
    return isClerkConfigured() ? null : EPHEMERAL_DEMO;
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getSessionUser();
  if (user) return user;
  throw new Error("UNAUTHENTICATED");
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export function isPersistedUser(user: AppUser): boolean {
  return !user.id.startsWith("ephemeral_");
}

export function adminConfigLabel(): string {
  return adminEmail() ? "configured" : "not configured";
}
