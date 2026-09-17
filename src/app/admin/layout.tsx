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
    { href: "/admin?tab=users", label: "Users" },
  ];

  return (
    <div data-admin-hud className="space-y-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="hud-kicker text-[10px] uppercase tracking-[0.28em]">
            <span className="jr-live-dot mr-2 align-middle" />
            Sys.core // admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="hud-muted mt-2 text-sm">Global telemetry — vraies opportunités uniquement. Rien n&apos;est inventé.</p>
        </div>
        <p className="hud-muted text-[10px] uppercase tracking-[0.2em]">{user.email ?? "admin"}</p>
      </div>
      <nav className="relative flex flex-wrap gap-2 text-sm">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="hud-tab rounded-full px-3 py-1.5">
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="relative">{children}</div>
    </div>
  );
}
