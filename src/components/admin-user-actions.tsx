"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({
  userId,
  hasProfile,
}: {
  userId: string;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove(scope: "profile" | "account") {
    const message =
      scope === "account"
        ? "Supprimer cet utilisateur JobRadar (profil, CV, sauvegardes, candidatures) ? Le compte Clerk n'est pas supprimé."
        : "Supprimer le profil / CV de cet utilisateur ?";
    if (!confirm(message)) return;
    setPending(true);
    await fetch(`/api/admin/users/${userId}?scope=${scope}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {hasProfile ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => void remove("profile")}
          className="rounded-full border border-line px-3 py-1 text-xs"
        >
          Delete profile
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void remove("account")}
        className="rounded-full border border-danger px-3 py-1 text-xs text-danger"
      >
        Delete user data
      </button>
    </div>
  );
}
