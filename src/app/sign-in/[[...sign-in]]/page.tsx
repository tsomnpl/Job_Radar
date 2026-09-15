import { AuthClerkPanel } from "@/components/auth-clerk-panel";
import { isClerkConfigured } from "@/lib/env";
import { safeAppPath } from "@/lib/safe-redirect";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectUrl = safeAppPath(redirect_url);
  if (!isClerkConfigured()) {
    return (
      <div className="panel mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="text-muted">Ouvrez le radar pour continuer.</p>
        <Link href={redirectUrl} className="btn-primary mt-2 inline-block rounded-full px-4 py-2 font-semibold">
          Continuer
        </Link>
      </div>
    );
  }
  return <AuthClerkPanel mode="sign-in" redirectUrl={redirectUrl} />;
}
