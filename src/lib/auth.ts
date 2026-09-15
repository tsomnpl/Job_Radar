import { currentUser } from "@clerk/nextjs/server";
import { adminClerkIds, isClerkConfigured } from "@/lib/env";
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
  name: "Profil démo",
  role: "ADMIN",
  isDemo: true,
};

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

async function upsertAppUser(input: {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role?: "USER" | "ADMIN";
}): Promise<AppUser> {
  const existing = await prisma.user.findUnique({ where: { clerkUserId: input.clerkUserId } });
  const allowlist = adminClerkIds();
  const role =
    input.role ??
    (existing?.role === "ADMIN" || allowlist.includes(input.clerkUserId) || allowlist.length === 0
      ? "ADMIN"
      : "USER");

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
  try {
    return await withTimeout(
      upsertAppUser({
        clerkUserId: DEMO_CLERK_ID,
        email: "demo@jobradar.local",
        name: "Profil démo",
        role: "ADMIN",
      }),
      2500,
      EPHEMERAL_DEMO,
    );
  } catch (error) {
    logDbError("getDemoUser", error);
    return EPHEMERAL_DEMO;
  }
}

export async function getSessionUser(): Promise<AppUser | null> {
  try {
    if (!isClerkConfigured()) {
      return getDemoUser();
    }

    const clerkUser = await withTimeout(currentUser(), 2500, null);
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;
    const allowlist = adminClerkIds();
    const role = allowlist.length === 0 || allowlist.includes(clerkUser.id) ? "ADMIN" : "USER";

    try {
      return await withTimeout(
        upsertAppUser({
          clerkUserId: clerkUser.id,
          email,
          name,
          role,
        }),
        2500,
        ephemeralFromClerk({ clerkUserId: clerkUser.id, email, name, role }),
      );
    } catch (error) {
      logDbError("upsertAppUser", error);
      return ephemeralFromClerk({ clerkUserId: clerkUser.id, email, name, role });
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
