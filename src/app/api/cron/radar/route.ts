import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { ingestPublicBoards } from "@/server/collect";
import { sendNewOpportunityAlerts } from "@/server/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const result = await ingestPublicBoards();
  const alerts = await sendNewOpportunityAlerts();
  return NextResponse.json({ ok: true, ...result, alerts });
}
