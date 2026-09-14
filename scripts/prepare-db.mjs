import { spawnSync } from "node:child_process";
import { applyDatabaseUrl, isPostgresConnectionUrl } from "./resolve-database-url.mjs";

applyDatabaseUrl();

if (!isPostgresConnectionUrl(process.env.DATABASE_URL)) {
  console.log(
    "[prepare-db] No Postgres URL found (DATABASE_URL / POSTGRES_URL / Job_POSTGRES_URL). Skipping migrate/seed. Search and jobs will use the bundled catalog.",
  );
  process.exit(0);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.warn(
      `[prepare-db] ${command} ${args.join(" ")} exited ${result.status ?? "unknown"}. Build continues; catalog fallback remains available.`,
    );
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("node", ["prisma/seed.mjs"]);
