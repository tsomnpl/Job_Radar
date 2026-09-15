-- Invented AI pistes must never appear as live opportunities.
UPDATE "Job" SET "active" = false WHERE "source" = 'ai-proposal';
