import { getSessionUser, type AppUser } from "@/lib/auth";

export async function getAdminOrNull(): Promise<AppUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
