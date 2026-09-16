import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const body = (await request.json().catch(() => null)) as { publish?: boolean; active?: boolean; archive?: boolean } | null;
    const archive = Boolean(body?.archive);
    const publish = body?.publish ?? body?.active ?? true;
    const status = archive ? "archived" : publish ? "published" : "unpublished";
    const job = await prisma.job.update({
      where: { id },
      data: { status, active: status === "published" },
    });
    return NextResponse.json({ id: job.id, status: job.status, active: job.active });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
