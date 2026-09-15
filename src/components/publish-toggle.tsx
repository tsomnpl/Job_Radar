"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishToggle({ jobId, active }: { jobId: string; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !on;
    const response = await fetch(`/api/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    setPending(false);
    if (response.ok) {
      setOn(next);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="rounded-full border border-line px-3 py-1 text-xs hover:border-accent disabled:opacity-60"
    >
      {on ? "Dépublier" : "Publier"}
    </button>
  );
}
