import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const body = (await request.json().catch(() => null)) as { active?: boolean } | null;
    const publish = Boolean(body?.active);
    const job = await prisma.job.update({
      where: { id },
      data: { active: publish, status: publish ? "published" : "unpublished" },
    });
    return NextResponse.json({ id: job.id, active: job.active, status: job.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    logDbError("api.publish", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
