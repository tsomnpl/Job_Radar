import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { parseCv } from "@/server/cv";
import { extractResumeText, isAllowedResumeFile } from "@/server/document-text";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }
    if (!isAllowedResumeFile(file)) {
      return NextResponse.json({ error: "UNSUPPORTED_FILE" }, { status: 400 });
    }

    let cvText = "";
    try {
      cvText = await extractResumeText(file);
    } catch (error) {
      const code = error instanceof Error ? error.message : "EXTRACT_FAILED";
      return NextResponse.json({ error: code }, { status: 400 });
    }
    if (cvText.length < 40) {
      return NextResponse.json({ error: "CV_TEXT_TOO_SHORT" }, { status: 400 });
    }

    const parsed = await parseCv(cvText);
    if (!isPersistedUser(user)) {
      return NextResponse.json({ parsed, cvText, persisted: false });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline: parsed.headline,
        summary: parsed.summary,
        cvText,
        skillsJson: JSON.stringify(parsed.skills),
        languagesJson: JSON.stringify(parsed.languages),
        locationsJson: JSON.stringify(parsed.locations),
        education: parsed.education,
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
        education: parsed.education,
        seniority: parsed.seniority,
        yearsExperience: parsed.yearsExperience,
        remotePreference: parsed.remotePreference,
        parsedAt: new Date(),
      },
    });

    return NextResponse.json({ parsed, profileId: profile.id, persisted: true, cvText });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.cv.upload", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
