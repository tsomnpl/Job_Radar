"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({
  initialQuery = "",
  size = "lg",
}: {
  initialQuery?: string;
  size?: "lg" | "md";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, setPending] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setPending(true);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-2xl border border-[#1c3a4d] bg-[#0c1b27] ${
          size === "lg" ? "p-2" : "p-1.5"
        }`}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex. stage data remote à Cotonou, CDI product designer Accra..."
          className={`w-full bg-transparent px-3 outline-none placeholder:text-[#6f8c90] ${
            size === "lg" ? "h-12 text-base" : "h-10 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-[#2ee6d6] px-4 py-2 text-sm font-semibold text-[#07111a] disabled:opacity-60"
        >
          {pending ? "Analyse..." : "Scanner"}
        </button>
      </div>
    </form>
  );
}
