import { NextResponse } from "next/server";
import { isPersistedUser, requireAdmin } from "@/lib/auth";
import { jobsFromCsv, jobsFromUnknown, normalizeJobInput } from "@/lib/import-jobs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!isPersistedUser(admin)) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const contentType = request.headers.get("content-type") ?? "";
    let filename: string | null = null;
    let format = "json";
    let jobsUnknown: unknown;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
      }
      filename = file.name;
      const text = await file.text();
      if (file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv")) {
        format = "csv";
        jobsUnknown = jobsFromCsv(text);
      } else {
        try {
          jobsUnknown = JSON.parse(text);
        } catch {
          return NextResponse.json({ error: "IMPORT_FORMAT_INVALID" }, { status: 400 });
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) return NextResponse.json({ error: "IMPORT_FORMAT_INVALID" }, { status: 400 });
      if (typeof (body as { csv?: unknown }).csv === "string") {
        format = "csv";
        jobsUnknown = jobsFromCsv((body as { csv: string }).csv);
      } else {
        jobsUnknown = body;
      }
    }

    const inputs = jobsFromUnknown(jobsUnknown);
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const [index, input] of inputs.entries()) {
      try {
        const data = normalizeJobInput(input);
        const existing = await prisma.job.findUnique({ where: { fingerprint: data.fingerprint } });
        if (existing) {
          await prisma.job.update({
            where: { id: existing.id },
            data: { ...data, status: existing.status === "published" ? "published" : "pending", active: existing.status === "published" },
          });
          updatedCount += 1;
        } else {
          await prisma.job.create({ data: { ...data, status: "pending", active: false } });
          createdCount += 1;
        }
      } catch (error) {
        skippedCount += 1;
        errors.push(`ligne ${index + 1}: ${error instanceof Error ? error.message : "INVALID"}`);
      }
    }

    const batch = await prisma.importBatch.create({
      data: {
        actorId: admin.id,
        filename,
        format,
        createdCount,
        updatedCount,
        skippedCount,
        errorJson: errors.length ? JSON.stringify(errors.slice(0, 50)) : null,
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      createdCount,
      updatedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "IMPORT_FORMAT_INVALID") {
      return NextResponse.json({ error: "IMPORT_FORMAT_INVALID" }, { status: 400 });
    }
    console.error("[api.import]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
