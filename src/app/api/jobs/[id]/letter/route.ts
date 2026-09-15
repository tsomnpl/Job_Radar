import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { asJsonArray } from "@/lib/normalize";
import { withDb } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { getJobById } from "@/server/jobs-store";
import { draftCoverLetter } from "@/server/letter";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const profile = isPersistedUser(user)
      ? await withDb("letter.profile", () => prisma.profile.findUnique({ where: { userId: user.id } }), null)
      : null;
    const letter = await draftCoverLetter(job, {
      headline: profile?.headline,
      summary: profile?.summary ?? "",
      skills: asJsonArray(profile?.skillsJson),
    });
    return NextResponse.json({ letter });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: "LETTER_FAILED" }, { status: 500 });
  }
}
