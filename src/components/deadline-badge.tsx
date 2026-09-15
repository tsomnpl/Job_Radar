import { deadlineKind, formatClosesIn } from "@/lib/job-lifecycle";

export function DeadlineBadge({ deadline }: { deadline?: Date | string | null }) {
  const kind = deadlineKind(deadline);
  const tone =
    kind === "expired"
      ? "text-danger border-danger"
      : kind === "closing_soon"
        ? "text-warn border-warn"
        : kind === "unspecified"
          ? "text-muted border-line"
          : "text-accent border-accent";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs ${tone}`}>{formatClosesIn(deadline)}</span>
  );
}
