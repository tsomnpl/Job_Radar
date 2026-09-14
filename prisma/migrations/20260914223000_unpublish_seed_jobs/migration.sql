-- Catalog seed jobs must not appear as live stock. Optional `npm run db:seed` can restore them.
UPDATE "Job" SET "active" = false WHERE "source" = 'seed';
