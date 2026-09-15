import { NextResponse } from "next/server";
import { ingestPublicBoards } from "@/server/collect";
import { sendDailyMatchDigests } from "@/server/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (secret) return authorization === `Bearer ${secret}`;
  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const result = await ingestPublicBoards();
  const alerts = await sendDailyMatchDigests();
  return NextResponse.json({ ok: true, ...result, alerts });
}
