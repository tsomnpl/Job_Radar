export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && process.env.CLERK_SECRET_KEY?.trim(),
  );
}

export function clerkPublishableKind(): "pk_live" | "pk_test" | "none" {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  if (key.startsWith("pk_live_")) return "pk_live";
  if (key.startsWith("pk_test_")) return "pk_test";
  return "none";
}

export function clerkSecretKind(): "sk_live" | "sk_test" | "none" {
  const key = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  if (key.startsWith("sk_live_")) return "sk_live";
  if (key.startsWith("sk_test_")) return "sk_test";
  return "none";
}

export function isClerkProduction(): boolean {
  return clerkPublishableKind() === "pk_live";
}

export function clerkKeysAligned(): boolean {
  const publishable = clerkPublishableKind();
  const secret = clerkSecretKind();
  if (publishable === "pk_live") return secret === "sk_live";
  if (publishable === "pk_test") return secret === "sk_test";
  return false;
}

export function clerkProxyEnvSet(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim());
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

export function isVercelAppHost(url = appUrl()): boolean {
  try {
    return new URL(url).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/**
 * Absolute Clerk Frontend API proxy URL.
 * Clerk: proxying does not work on development instances — never advertise /__clerk for pk_test_.
 */
export function clerkProxyUrl(): string | null {
  if (!isClerkProduction()) return null;
  const explicit = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return `${appUrl()}/__clerk`;
}

/** Path or URL the Clerk JS client uses. Undefined in Development so pk_test_ keeps talking to accounts.dev. */
export function clerkClientProxyUrl(): string | undefined {
  if (!isClerkProduction()) return undefined;
  return process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim().replace(/\/$/, "") || "/__clerk";
}

export function clerkAuthorizedParties(): string[] {
  const parties = new Set<string>([appUrl(), "https://job-radar-six-ochre.vercel.app"]);
  return [...parties].filter((origin) => /^https?:\/\//.test(origin));
}

export function parseEmailFrom(raw?: string | null): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  const address = value.match(/<([^>]+)>/)?.[1]?.trim() ?? value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
  if (address.toLowerCase().endsWith("@example.com")) return null;
  return value;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && parseEmailFrom(process.env.EMAIL_FROM));
}

export function rodiumBaseUrl(): string {
  return (process.env.RODIUMAI_BASE_URL?.trim() || "https://api.rodiumai.io/v1").replace(/\/$/, "");
}

export function rodiumModel(): string {
  return process.env.RODIUMAI_MODEL?.trim() || "rodiumai/smart";
}

export function adminClerkIds(): string[] {
  return (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Fail-closed admin email. Empty/invalid ADMIN_EMAIL → nobody is admin. */
export function adminEmail(): string | null {
  const value = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const configured = adminEmail();
  if (!configured) return false;
  return (email?.trim().toLowerCase() ?? "") === configured;
}

export function isAdminDisabled(): boolean {
  return adminEmail() == null && adminClerkIds().length === 0;
}

export function isConfiguredAdmin(input: {
  email?: string | null;
  verifiedEmails?: string[];
  clerkUserId?: string | null;
}): boolean {
  const emails = [
    ...(input.verifiedEmails ?? []),
    ...(input.email ? [input.email] : []),
  ];
  if (emails.some((value) => isAdminEmail(value))) return true;
  const ids = adminClerkIds();
  return Boolean(input.clerkUserId && ids.includes(input.clerkUserId));
}

export function isRodiumConfigured(): boolean {
  return Boolean(process.env.RODIUMAI_API_KEY?.trim());
}
