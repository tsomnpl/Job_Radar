import { notFound } from "next/navigation";
import { OpportunityForm } from "@/components/opportunity-form";
import { getAdminOrNull } from "@/lib/admin-page";
import { getJobByIdAdmin } from "@/server/jobs-store";

export const dynamic = "force-dynamic";

export default async function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminOrNull())) return null;
  const { id } = await params;
  const job = await getJobByIdAdmin(id);
  if (!job) notFound();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit opportunity</h2>
      <OpportunityForm job={job} />
    </div>
  );
}
