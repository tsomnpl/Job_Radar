import { describe, expect, it } from "vitest";
import { applyDatabaseUrl, isPostgresConnectionUrl, unwrapDatabaseUrl } from "@/lib/database-url";

describe("database url unwrap", () => {
  it("extracts a postgres URL from a JSON array", () => {
    expect(
      unwrapDatabaseUrl('["postgres://u:p@db.prisma.io:5432/postgres?sslmode=require"]'),
    ).toBe("postgres://u:p@db.prisma.io:5432/postgres?sslmode=require");
  });

  it("prefers a pooled postgres URL when both are present", () => {
    expect(
      unwrapDatabaseUrl(
        '["postgres://u:p@db.prisma.io:5432/postgres?sslmode=require","postgres://u:p@pooled.db.prisma.io:5432/postgres?sslmode=require"]',
      ),
    ).toBe("postgres://u:p@pooled.db.prisma.io:5432/postgres?sslmode=require");
  });

  it("strips wrapping quotes and brackets", () => {
    expect(unwrapDatabaseUrl('"[postgres://u:p@localhost:5432/db]"')).toBe("postgres://u:p@localhost:5432/db");
  });

  it("maps Job_POSTGRES_URL onto DATABASE_URL", () => {
    const env: Record<string, string | undefined> = {
      Job_POSTGRES_URL: '["postgresql://job:secret@localhost:5432/jobradar"]',
    };
    expect(applyDatabaseUrl(env)).toBe("postgresql://job:secret@localhost:5432/jobradar");
    expect(env.DATABASE_URL).toBe("postgresql://job:secret@localhost:5432/jobradar");
    expect(isPostgresConnectionUrl(env.DATABASE_URL)).toBe(true);
  });
});
