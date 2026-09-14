export function logDbError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(`[db:${scope}]`, message);
}

export async function withDb<T>(scope: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logDbError(scope, error);
    return fallback;
  }
}

export function isPostgresUrl(url = process.env.DATABASE_URL): boolean {
  return /^(postgres(ql)?:\/\/|prisma\+postgres:\/\/)/i.test(url?.trim() ?? "");
}
