import { prisma } from "@/lib/prisma";

export function accountDeleteScope(value: string | null | undefined): "profile" | "account" {
  return value === "account" ? "account" : "profile";
}

export async function deleteProfileForUser(userId: string): Promise<{ deleted: boolean }> {
  const result = await prisma.profile.deleteMany({ where: { userId } });
  return { deleted: result.count > 0 };
}

export async function deleteAccountDataForUser(userId: string): Promise<{ deleted: boolean }> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) return { deleted: false };
  await prisma.user.delete({ where: { id: userId } });
  return { deleted: true };
}
