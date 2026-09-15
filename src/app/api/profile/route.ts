import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { parseRemoteType, parseSeniority, parseSkillList } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { deleteAccountDataForUser, deleteProfileForUser, accountDeleteScope } from "@/server/account";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as {
      headline?: string;
      skills?: string;
      locations?: string;
      seniority?: string;
      remotePreference?: string;
    } | null;

    const headline = body?.headline?.trim() || null;
    const skills = parseSkillList(body?.skills ?? "");
    const locations = parseSkillList(body?.locations ?? "");
    const seniority = parseSeniority(body?.seniority ?? null);
    const remotePreference = parseRemoteType(body?.remotePreference ?? null);

    if (!isPersistedUser(user)) {
      return NextResponse.json({ persisted: false, profile: { headline, skills, locations, seniority, remotePreference } });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline,
        skillsJson: JSON.stringify(skills),
        locationsJson: JSON.stringify(locations),
        seniority,
        remotePreference,
      },
      create: {
        userId: user.id,
        headline,
        skillsJson: JSON.stringify(skills),
        locationsJson: JSON.stringify(locations),
        seniority,
        remotePreference,
      },
    });

    return NextResponse.json({ persisted: true, profileId: profile.id });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.profile", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    if (!isPersistedUser(user)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const url = new URL(request.url);
    const scope = accountDeleteScope(url.searchParams.get("scope"));
    const result =
      scope === "account" ? await deleteAccountDataForUser(user.id) : await deleteProfileForUser(user.id);
    return NextResponse.json({ ok: true, scope, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.profile.delete", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
