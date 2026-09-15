"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SaveJobButton({ jobId, initialSaved }: { jobId: string; initialSaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const response = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" });
    const data = (await response.json()) as { saved?: boolean };
    if (response.ok) setSaved(Boolean(data.saved));
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
    >
      {saved ? "Retiré du radar" : "Garder sur le radar"}
    </button>
  );
}
