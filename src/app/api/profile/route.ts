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
      domains?: string;
      contractTypes?: string;
      keywords?: string;
      emailNotifications?: boolean;
      newOpportunityAlerts?: boolean;
      deadlineAlerts?: boolean;
      weeklyDigest?: boolean;
      locale?: string;
    } | null;

    const headline = body?.headline?.trim() || null;
    const skills = parseSkillList(body?.skills ?? "");
    const locations = parseSkillList(body?.locations ?? "");
    const domains = parseSkillList(body?.domains ?? body?.headline ?? "");
    const contractTypes = parseSkillList(body?.contractTypes ?? "");
    const keywords = parseSkillList(body?.keywords ?? "");
    const seniority = parseSeniority(body?.seniority ?? null);
    const remotePreference = parseRemoteType(body?.remotePreference ?? null);

    if (!isPersistedUser(user)) {
      return NextResponse.json({
        persisted: false,
        profile: { headline, skills, locations, seniority, remotePreference, domains, contractTypes, keywords },
      });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline,
        skillsJson: JSON.stringify(skills),
        locationsJson: JSON.stringify(locations),
        seniority,
        remotePreference,
        domainsJson: JSON.stringify(domains),
        contractTypesJson: JSON.stringify(contractTypes),
        keywordsJson: JSON.stringify(keywords),
      },
      create: {
        userId: user.id,
        headline,
        skillsJson: JSON.stringify(skills),
        locationsJson: JSON.stringify(locations),
        seniority,
        remotePreference,
        domainsJson: JSON.stringify(domains),
        contractTypesJson: JSON.stringify(contractTypes),
        keywordsJson: JSON.stringify(keywords),
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(typeof body?.emailNotifications === "boolean" ? { emailNotifications: body.emailNotifications } : {}),
        ...(typeof body?.newOpportunityAlerts === "boolean" ? { newOpportunityAlerts: body.newOpportunityAlerts } : {}),
        ...(typeof body?.deadlineAlerts === "boolean" ? { deadlineAlerts: body.deadlineAlerts } : {}),
        ...(typeof body?.weeklyDigest === "boolean" ? { weeklyDigest: body.weeklyDigest } : {}),
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
