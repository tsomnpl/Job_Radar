import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import Link from "next/link";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold">Mode démo</h1>
        <p className="mt-3 text-[#b9d4d4]">Ajoutez les clés Clerk pour activer l&apos;inscription réelle.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-[#2ee6d6]">
          Dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-8">
      <SignUp />
    </div>
  );
}
