import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { opportunityFormSchema } from "@/lib/job-schema";
import { normalizeJobInput } from "@/lib/import-jobs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const body = await request.json().catch(() => null);
    const parsed = opportunityFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
    const status = input.publishNow ? "published" : "pending";
    const normalized = normalizeJobInput({
      title: input.title,
      company: input.company,
      companyLogo: input.companyLogo,
      location: input.location,
      country: input.country,
      remoteType: input.remoteType,
      contractType: input.contractType,
      seniority: input.seniority ?? input.experience,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      currency: input.currency,
      skills: input.skills,
      languages: input.language,
      description: input.description,
      requirements: input.requirements,
      education: input.education,
      experience: input.experience,
      benefits: input.benefits,
      duration: input.duration,
      contactInfo: input.contactInfo,
      sourceUrl: input.sourceUrl,
      applicationUrl: input.applicationUrl,
      source: "manual",
      language: input.language,
      postedAt: input.postedAt,
      deadline: input.deadline,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const existing = await prisma.job.findUnique({ where: { fingerprint: normalized.fingerprint } });
    if (existing) {
      const job = await prisma.job.update({
        where: { id: existing.id },
        data: { ...normalized, status, active: status === "published" },
      });
      return NextResponse.json({ id: job.id, status: job.status, updated: true });
    }

    const job = await prisma.job.create({
      data: { ...normalized, status, active: status === "published" },
    });
    return NextResponse.json({ id: job.id, status: job.status, created: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("[api.admin.jobs]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim();
    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ jobs });
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
