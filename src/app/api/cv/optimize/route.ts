import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { optimizeCvHints } from "@/server/letter";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = (await request.json().catch(() => null)) as { cvText?: string; target?: string } | null;
    const cvText = body?.cvText?.trim() ?? "";
    if (cvText.length < 40) {
      return NextResponse.json({ error: "CV_TEXT_TOO_SHORT" }, { status: 400 });
    }
    const advice = await optimizeCvHints(cvText, body?.target);
    return NextResponse.json({ advice });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: "OPTIMIZE_FAILED" }, { status: 500 });
  }
}
