import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { extractJobFromText } from "@/server/extract-job";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const body = (await request.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim() ?? "";
    if (text.length < 40) {
      return NextResponse.json({ error: "TEXT_TOO_SHORT" }, { status: 400 });
    }
    const job = await extractJobFromText(text);
    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "EXTRACT_FAILED" }, { status: 500 });
  }
}
