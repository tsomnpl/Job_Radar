import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { opportunityFormSchema } from "@/lib/job-schema";
import { normalizeJobInput } from "@/lib/import-jobs";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const parsed = opportunityFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
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
      source: existing.source || "manual",
      language: input.language,
      postedAt: input.postedAt ?? existing.postedAt,
      deadline: input.deadline,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    const status = input.publishNow ? "published" : existing.status;
    const job = await prisma.job.update({
      where: { id },
      data: { ...normalized, status, active: status === "published" },
    });
    return NextResponse.json({ id: job.id, status: job.status });
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

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
