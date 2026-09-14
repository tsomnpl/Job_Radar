import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/env";
import Link from "next/link";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold">Mode démo</h1>
        <p className="mt-3 text-muted">
          Clerk n&apos;est pas configuré. Le radar tourne avec un profil local administrateur.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-block rounded-full px-4 py-2 font-semibold">
          Continuer vers le dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-8">
      <SignIn appearance={clerkAppearance} fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
