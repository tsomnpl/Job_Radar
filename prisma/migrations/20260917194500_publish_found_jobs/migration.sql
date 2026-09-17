-- Found / collected / imported jobs go live immediately.
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'published';
ALTER TABLE "Job" ALTER COLUMN "active" SET DEFAULT true;

-- Existing pending stock must appear on /jobs.
UPDATE "Job"
SET status = 'published', active = true
WHERE status = 'pending';
