import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { jobExistsInDb } from "@/server/jobs-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!isPersistedUser(user) || !(await jobExistsInDb(id))) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }

    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: id } },
    });
    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false, status: null });
    }
    await prisma.savedJob.create({ data: { userId: user.id, jobId: id, status: "watching" } });
    return NextResponse.json({ saved: true, status: "watching" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.save", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
