import { NextResponse } from "next/server";
import { listActiveJobs } from "@/server/jobs-store";

export async function GET() {
  const jobs = await listActiveJobs();
  return NextResponse.json({ jobs: jobs.slice(0, 50) });
}
