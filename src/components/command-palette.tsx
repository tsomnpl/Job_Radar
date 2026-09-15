"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { href: string; title: string; subtitle: string };

export function CommandPalette({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Hit[]>([]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("jobradar-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("jobradar-command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch("/api/jobs", { signal: controller.signal })
        .then((response) => response.json())
        .then((data: { jobs?: Array<{ id: string; title: string; company: string }> }) => {
          setJobs(
            (data.jobs ?? []).map((job) => ({
              href: `/jobs/${job.id}`,
              title: job.title,
              subtitle: job.company,
            })),
          );
        })
        .catch(() => setJobs([]));
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open]);

  const pages: Hit[] = useMemo(() => {
    const items: Hit[] = [
      { href: "/", title: "Home", subtitle: "Landing" },
      { href: "/search", title: "Search", subtitle: "Natural language search" },
      { href: "/jobs", title: "Jobs", subtitle: "Published opportunities" },
    ];
    if (signedIn) {
      items.push(
        { href: "/dashboard", title: "Dashboard", subtitle: "Career command center" },
        { href: "/cv", title: "CV analysis", subtitle: "Profile and CV" },
        { href: "/saved-jobs", title: "My saved jobs", subtitle: "Saved opportunities" },
        { href: "/applications", title: "Applications", subtitle: "Marked as applied" },
        { href: "/search?deadline=closing_soon", title: "Closing soon", subtitle: "Filter" },
      );
    }
    return items;
  }, [signedIn]);

  const needle = query.trim().toLowerCase();
  const filtered = [...pages, ...jobs].filter((item) => {
    if (!needle) return true;
    return `${item.title} ${item.subtitle}`.toLowerCase().includes(needle);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050A1D]/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command search">
      <div className="mx-auto mt-16 max-w-lg panel p-3">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search opportunities, pages, CV…"
          className="field w-full rounded-xl px-3 py-3 text-sm"
        />
        <ul className="mt-2 max-h-80 overflow-auto">
          {filtered.length ? (
            filtered.slice(0, 20).map((item) => (
              <li key={item.href + item.title}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left hover:bg-elev"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(item.href);
                  }}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">{item.subtitle}</p>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-sm text-muted">No matching opportunities found.</li>
          )}
        </ul>
        <p className="px-3 py-2 text-xs text-muted">Esc to close · Ctrl/Cmd + K</p>
      </div>
    </div>
  );
}
