import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/env";
import { sendAdminTestEmail } from "@/server/transactional-email";

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
    }
    const to = admin.email;
    const result = await sendAdminTestEmail(to);
    return NextResponse.json({
      ok: result.sent,
      skipped: result.skipped,
      error: result.error ?? null,
      to: isPersistedUser(admin) ? to : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "EMAIL_FAILED" }, { status: 500 });
  }
}
