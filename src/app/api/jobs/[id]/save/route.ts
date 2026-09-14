import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: id } },
    });
    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }
    await prisma.savedJob.create({ data: { userId: user.id, jobId: id } });
    return NextResponse.json({ saved: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    throw error;
  }
}
