/** Only same-origin app paths. Prevents open redirects after Sign In / Sign Up. */
export function safeAppPath(value: string | null | undefined, fallback = "/dashboard"): string {
  const raw = value?.trim() ?? "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (raw.startsWith("/sign-in") || raw.startsWith("/sign-up")) return fallback;
  return raw;
}
