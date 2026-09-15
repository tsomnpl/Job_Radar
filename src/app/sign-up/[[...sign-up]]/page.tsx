import { AuthClerkPanel } from "@/components/auth-clerk-panel";
import { isClerkConfigured } from "@/lib/env";
import Link from "next/link";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="panel mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Inscription — mode démo</h1>
        <p className="text-muted">Ajoutez les clés Clerk pour une vraie inscription. En démo, le dashboard s&apos;ouvre.</p>
        <Link href="/dashboard" className="btn-primary mt-2 inline-block rounded-full px-4 py-2 font-semibold">
          Ouvrir le dashboard
        </Link>
      </div>
    );
  }
  return <AuthClerkPanel mode="sign-up" />;
}
