import { OpportunityForm } from "@/components/opportunity-form";
import { getAdminOrNull } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminNewPage() {
  if (!(await getAdminOrNull())) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add Opportunity</h2>
      <p className="text-sm text-muted">
        Si une information n&apos;est pas connue, laissez vide : JobRadar affichera Not specified. Ne jamais inventer une URL ou une entreprise.
      </p>
      <OpportunityForm />
    </div>
  );
}
