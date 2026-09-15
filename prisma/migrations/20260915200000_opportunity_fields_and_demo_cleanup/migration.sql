-- Opportunity fields for real admin-managed jobs.
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "companyLogo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "applicationUrl" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "requirements" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "education" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "experience" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "benefits" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "contactInfo" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Job" ALTER COLUMN "remoteType" SET DEFAULT 'unspecified';
ALTER TABLE "Job" ALTER COLUMN "contractType" SET DEFAULT 'other';
ALTER TABLE "Job" ALTER COLUMN "seniority" SET DEFAULT 'unspecified';
ALTER TABLE "Job" ALTER COLUMN "currency" SET DEFAULT '';
ALTER TABLE "Job" ALTER COLUMN "active" SET DEFAULT false;

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "education" TEXT;

-- Keep currently published real stock published. Do not invent new actives.
UPDATE "Job"
SET "status" = 'published'
WHERE "active" = true
  AND "source" NOT IN ('seed', 'ai-proposal')
  AND "source" NOT LIKE 'ai/%';

UPDATE "Job"
SET "status" = 'unpublished'
WHERE "active" = false
  AND "source" NOT IN ('seed', 'ai-proposal')
  AND "source" NOT LIKE 'ai/%';

UPDATE "Job"
SET "applicationUrl" = "sourceUrl"
WHERE "applicationUrl" IS NULL
  AND "sourceUrl" IS NOT NULL
  AND "sourceUrl" LIKE 'http%';

-- PHASE 1 cleanup: only clearly fictitious catalog / AI-invented rows.
-- Kept: public-board jobs (jobicy, themuse, remotive, remoteok, himalayas),
-- manual/extract/csv imports, and real Clerk users.
DELETE FROM "Job"
WHERE "source" = 'seed'
   OR "id" LIKE 'cat_%'
   OR "source" = 'ai-proposal'
   OR "source" LIKE 'ai/%';

DELETE FROM "User"
WHERE "clerkUserId" = 'demo_local_user';

CREATE TABLE IF NOT EXISTS "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Application_userId_jobId_key" ON "Application"("userId", "jobId");

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Application_userId_fkey'
  ) THEN
    ALTER TABLE "Application"
      ADD CONSTRAINT "Application_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Application_jobId_fkey'
  ) THEN
    ALTER TABLE "Application"
      ADD CONSTRAINT "Application_jobId_fkey"
      FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
