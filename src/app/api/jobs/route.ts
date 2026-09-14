import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJobRecord } from "@/lib/jobs";

export async function GET() {
  const jobs = await prisma.job.findMany({
    where: { active: true },
    orderBy: { postedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ jobs: jobs.map(toJobRecord) });
}
