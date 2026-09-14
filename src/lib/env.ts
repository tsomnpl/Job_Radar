export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() && process.env.CLERK_SECRET_KEY?.trim(),
  );
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

export function isRodiumConfigured(): boolean {
  return Boolean(process.env.RODIUMAI_API_KEY?.trim());
}
