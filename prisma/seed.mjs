import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function fold(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function fingerprint(title, company, location) {
  return [title, company, location].map(fold).join("|");
}

function catalogJobId(value) {
  const slug = value
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
  return `cat_${slug}`;
}

const catalog = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/lib/job-catalog.json"), "utf8"),
);

async function main() {
  for (const job of catalog) {
    const fp = fingerprint(job.title, job.company, job.location);
    const data = {
      id: catalogJobId(fp),
      title: job.title,
      company: job.company,
      location: job.location,
      country: job.country,
      remoteType: job.remoteType,
      contractType: job.contractType,
      seniority: job.seniority,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      skillsJson: JSON.stringify(job.skills),
      languagesJson: JSON.stringify(job.languages),
      description: job.description,
      sourceUrl: null,
      source: "seed",
      language: job.languages[0] ?? "fr",
      postedAt: daysAgo(job.postedDaysAgo),
      fingerprint: fp,
      active: true,
    };
    const { id, ...update } = data;
    await prisma.job.upsert({
      where: { fingerprint: data.fingerprint },
      update,
      create: { id, ...update },
    });
  }
  console.log(`Seeded ${catalog.length} JobRadar offers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
