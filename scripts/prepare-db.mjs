import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";
const isPostgres = /^(postgres(ql)?:\/\/|prisma\+postgres:\/\/)/i.test(url);

if (!isPostgres) {
  console.log(
    "[prepare-db] DATABASE_URL is not Postgres — skipping migrate/seed. Search and jobs will use the bundled catalog.",
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
