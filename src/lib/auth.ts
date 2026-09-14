import { currentUser } from "@clerk/nextjs/server";
import { adminClerkIds, isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const DEMO_CLERK_ID = "demo_local_user";

export type AppUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  isDemo: boolean;
};

async function upsertAppUser(input: {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role?: "USER" | "ADMIN";
}): Promise<AppUser> {
  const existing = await prisma.user.findUnique({ where: { clerkUserId: input.clerkUserId } });
  const role =
    input.role ??
    (existing?.role === "ADMIN" || adminClerkIds().includes(input.clerkUserId) ? "ADMIN" : "USER");

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

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    isDemo: user.clerkUserId === DEMO_CLERK_ID,
  };
}

export async function getDemoUser(): Promise<AppUser> {
  return upsertAppUser({
    clerkUserId: DEMO_CLERK_ID,
    email: "demo@jobradar.local",
    name: "Profil démo",
    role: "ADMIN",
  });
}

export async function getSessionUser(): Promise<AppUser | null> {
  if (!isClerkConfigured()) {
    return getDemoUser();
  }

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;
  const role = adminClerkIds().includes(clerkUser.id) ? "ADMIN" : "USER";

  return upsertAppUser({
    clerkUserId: clerkUser.id,
    email,
    name,
    role,
  });
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
