import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCv } from "@/server/cv";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as { cvText?: string } | null;
    const cvText = body?.cvText?.trim();
    if (!cvText || cvText.length < 40) {
      return NextResponse.json({ error: "CV_TEXT_TOO_SHORT" }, { status: 400 });
    }

    const parsed = await parseCv(cvText);
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline: parsed.headline,
        summary: parsed.summary,
        cvText,
        skillsJson: JSON.stringify(parsed.skills),
        languagesJson: JSON.stringify(parsed.languages),
        locationsJson: JSON.stringify(parsed.locations),
        seniority: parsed.seniority,
        yearsExperience: parsed.yearsExperience,
        remotePreference: parsed.remotePreference,
        parsedAt: new Date(),
      },
      create: {
        userId: user.id,
        headline: parsed.headline,
        summary: parsed.summary,
        cvText,
        skillsJson: JSON.stringify(parsed.skills),
        languagesJson: JSON.stringify(parsed.languages),
        locationsJson: JSON.stringify(parsed.locations),
        seniority: parsed.seniority,
        yearsExperience: parsed.yearsExperience,
        remotePreference: parsed.remotePreference,
        parsedAt: new Date(),
      },
    });

    return NextResponse.json({ parsed, profileId: profile.id });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    throw error;
  }
}
