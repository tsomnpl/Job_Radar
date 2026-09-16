"use client";

import { officialLogoUrl } from "@/lib/jobs";

export function CompanyLogo({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const url = officialLogoUrl(src);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  if (!url) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-xl border border-line bg-elev text-xs font-semibold text-muted"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
        alt={`${name} logo`}
      width={size}
      height={size}
      className="shrink-0 rounded-xl border border-line object-cover bg-elev"
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
      onError={(event) => {
        event.currentTarget.style.display = "none";
        const fallback = event.currentTarget.nextElementSibling;
        if (fallback instanceof HTMLElement) fallback.style.display = "grid";
      }}
    />
  );
}
