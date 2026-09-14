const CANDIDATE_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "PRISMA_DATABASE_URL",
  "Job_POSTGRES_URL",
  "Job_PRISMA_DATABASE_URL",
  "Job_DATABASE_URL",
];

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function isPlainPostgres(url) {
  return /^(postgres(ql)?:\/\/)/i.test(url);
}

function isPrismaPostgres(url) {
  return /^(prisma\+postgres:\/\/)/i.test(url);
}

function pickPreferredUrl(urls) {
  const postgres = urls.filter(isPlainPostgres);
  if (postgres.length) {
    const pooled = postgres.find((url) => /pooled\.db\.prisma\.io|pgbouncer=true|-pooler\./i.test(url));
    return pooled ?? postgres[0];
  }
  return urls.find(isPrismaPostgres) ?? urls[0] ?? "";
}

export function unwrapDatabaseUrl(raw) {
  if (!raw) return "";
  let value = stripWrappingQuotes(String(raw).trim());
  if (!value) return "";

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
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

export function resolveDatabaseUrl(env = process.env) {
  for (const key of CANDIDATE_KEYS) {
    const url = unwrapDatabaseUrl(env[key]);
    if (url) return url;
  }
  return "";
}

export function applyDatabaseUrl(env = process.env) {
  const url = resolveDatabaseUrl(env);
  if (url) env.DATABASE_URL = url;
  return url;
}

export function isPostgresConnectionUrl(url) {
  const value = unwrapDatabaseUrl(url);
  return isPlainPostgres(value) || isPrismaPostgres(value);
}
