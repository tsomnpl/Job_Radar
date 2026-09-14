"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplyButton({ jobId, initialStatus }: { jobId: string; initialStatus: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);

  async function apply() {
    setPending(true);
    const response = await fetch(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "applied" }),
    });
    const data = (await response.json()) as { status?: string; error?: string };
    setPending(false);
    if (response.ok) {
      setStatus(data.status ?? "applied");
      router.refresh();
      return;
    }
    if (response.status === 401) window.location.href = "/sign-in";
  }

  const applied = status === "applied" || status === "interviewing" || status === "offer";

  return (
    <button
      type="button"
      onClick={apply}
      disabled={pending || applied}
      className="btn-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
    >
      {applied ? "Candidature suivie" : pending ? "Enregistrement..." : "Suivre ma candidature"}
    </button>
  );
}
