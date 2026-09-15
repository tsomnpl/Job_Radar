import { NextResponse } from "next/server";
import { listStockJobs } from "@/server/jobs-store";

export async function GET() {
  const jobs = await listStockJobs();
  return NextResponse.json({ jobs: jobs.slice(0, 50) });
}
