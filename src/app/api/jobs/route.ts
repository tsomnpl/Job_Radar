import { NextResponse } from "next/server";
import { listSearchableJobs } from "@/server/jobs-store";

export async function GET() {
  const jobs = await listSearchableJobs();
  return NextResponse.json({ jobs: jobs.slice(0, 50) });
}
