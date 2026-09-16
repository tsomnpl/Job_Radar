"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { href: string; title: string; subtitle: string };

export function CommandPalette({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => {
          const next = !value;
          if (next) setActive(0);
          return next;
        });
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setActive(0);
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
      { href: "/privacy", title: "Privacy", subtitle: "Data JobRadar stores" },
      { href: "/terms", title: "Terms", subtitle: "How JobRadar works" },
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
  const filtered = [...pages, ...jobs]
    .filter((item) => {
      if (!needle) return true;
      return `${item.title} ${item.subtitle}`.toLowerCase().includes(needle);
    })
    .slice(0, 20);
  const selected = Math.min(active, Math.max(filtered.length - 1, 0));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setActive(0);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050A1D]/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command search">
      <div className="mx-auto mt-16 max-w-lg panel p-3">
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, Math.max(filtered.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            }
            if (event.key === "Enter" && filtered[selected]) {
              event.preventDefault();
              go(filtered[selected].href);
            }
          }}
          placeholder="Search opportunities, pages, CV…"
          className="field w-full rounded-xl px-3 py-3 text-sm"
          aria-autocomplete="list"
          aria-controls="jobradar-command-results"
        />
        <ul id="jobradar-command-results" className="mt-2 max-h-80 overflow-auto" role="listbox">
          {filtered.length ? (
            filtered.map((item, index) => (
              <li key={item.href + item.title} role="option" aria-selected={index === selected}>
                <button
                  type="button"
                  className={`w-full rounded-xl px-3 py-2 text-left ${index === selected ? "bg-elev" : "hover:bg-elev"}`}
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActive(index)}
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
        <p className="px-3 py-2 text-xs text-muted">↑↓ to move · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}
