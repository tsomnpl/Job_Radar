import { redirect } from "next/navigation";
import { getSessionUser, type AppUser } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/env";

export async function requirePageUser(next: string): Promise<AppUser> {
  const user = await getSessionUser();
  if (isClerkConfigured()) {
    if (!user || user.isDemo) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
    }
    return user;
  }
  if (!user) redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
  return user;
}

export async function getOptionalUser(): Promise<AppUser | null> {
  return getSessionUser();
}
