"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AdminJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setPublish(publish: boolean) {
    setPending(true);
    await fetch(`/api/admin/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish }),
    });
    setPending(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    setPending(true);
    await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/jobs/${jobId}/edit`} className="rounded-full border border-line px-3 py-1 text-xs">
        Edit
      </Link>
      {status === "published" ? (
        <button type="button" disabled={pending} onClick={() => setPublish(false)} className="rounded-full border border-line px-3 py-1 text-xs">
          Unpublish
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => setPublish(true)} className="rounded-full border border-line px-3 py-1 text-xs">
          Publish
        </button>
      )}
      <button type="button" disabled={pending} onClick={remove} className="rounded-full border border-danger px-3 py-1 text-xs text-danger">
        Delete
      </button>
    </div>
  );
}
