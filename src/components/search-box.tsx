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
      <div className={`field flex items-center gap-2 rounded-2xl ${size === "lg" ? "p-2" : "p-1.5"}`}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What opportunity are you looking for?"
          className={`w-full bg-transparent px-3 outline-none placeholder:text-muted ${
            size === "lg" ? "h-12 text-base" : "h-10 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Searching..." : "Search Opportunities"}
        </button>
      </div>
    </form>
  );
}
