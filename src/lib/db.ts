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

export { isPostgresConnectionUrl as isPostgresUrl } from "@/lib/database-url";
