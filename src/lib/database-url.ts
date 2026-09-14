const CANDIDATE_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "PRISMA_DATABASE_URL",
  "Job_POSTGRES_URL",
  "Job_PRISMA_DATABASE_URL",
  "Job_DATABASE_URL",
] as const;

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function isPlainPostgres(url: string): boolean {
  return /^(postgres(ql)?:\/\/)/i.test(url);
}

function isPrismaPostgres(url: string): boolean {
  return /^(prisma\+postgres:\/\/)/i.test(url);
}

function pickPreferredUrl(urls: string[]): string {
  const postgres = urls.filter(isPlainPostgres);
  if (postgres.length) {
    const pooled = postgres.find((url) => /pooled\.db\.prisma\.io|pgbouncer=true|-pooler\./i.test(url));
    return pooled ?? postgres[0];
  }
  return urls.find(isPrismaPostgres) ?? urls[0] ?? "";
}

/** Vercel/Prisma sometimes stores `["postgres://..."]` instead of a raw URL. */
export function unwrapDatabaseUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  let value = stripWrappingQuotes(raw.trim());
  if (!value) return "";

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        const urls = parsed.map((item) => stripWrappingQuotes(String(item).trim())).filter(Boolean);
        return pickPreferredUrl(urls);
      }
    } catch {
      if (value.endsWith("]")) {
        return stripWrappingQuotes(value.slice(1, -1).trim());
      }
    }
  }

  return value;
}

export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  for (const key of CANDIDATE_KEYS) {
    const url = unwrapDatabaseUrl(env[key]);
    if (url) return url;
  }
  return "";
}

export function applyDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const url = resolveDatabaseUrl(env);
  if (url) env.DATABASE_URL = url;
  return url;
}

export function isPostgresConnectionUrl(url: string | undefined | null): boolean {
  const value = unwrapDatabaseUrl(url);
  return isPlainPostgres(value) || isPrismaPostgres(value);
}
