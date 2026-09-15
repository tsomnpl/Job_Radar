import { PrismaClient } from "@prisma/client";
import { applyDatabaseUrl } from "../scripts/resolve-database-url.mjs";

applyDatabaseUrl();

const prisma = new PrismaClient();

async function main() {
  if (process.env.FORCE_DEMO_SEED !== "1") {
    console.log(
      "Demo seed is disabled. Add real opportunities from Admin. Set FORCE_DEMO_SEED=1 only if you explicitly want the old catalog.",
    );
    return;
  }
  console.error("FORCE_DEMO_SEED is set, but the fictitious catalog is no longer loaded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
