import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/env";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (isClerkConfigured() && !user) {
    redirect("/sign-in?redirect_url=/admin");
  }
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="panel mx-auto max-w-xl space-y-3 p-8">
        <h1 className="text-2xl font-semibold">Accès admin refusé</h1>
        <p className="text-sm text-muted">
          L&apos;administration JobRadar est privée. Si vous êtes le propriétaire, configurez{" "}
          <code>ADMIN_EMAIL</code> avec l&apos;email vérifié de votre compte Clerk.
        </p>
        <Link href="/" className="text-sm text-accent">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const tabs = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/new", label: "Add Opportunity" },
    { href: "/admin?tab=opportunities", label: "Opportunities" },
    { href: "/admin?tab=pending", label: "Pending" },
    { href: "/admin?tab=published", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Private</p>
        <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-muted">Gérez de vraies opportunités. Rien n&apos;est inventé.</p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="rounded-full border border-line px-3 py-1.5 hover:border-accent">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
