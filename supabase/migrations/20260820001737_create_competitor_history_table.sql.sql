/*
# Create CompetitorHistory table for Wayback Machine historical pricing data

1. Purpose
   Stores historical pricing snapshots pulled from the Internet Archive's
   Wayback Machine, one row per competitor per year per course type.

2. Security
   Same no-auth pattern as all other tables: anon + authenticated CRUD,
   data is intentionally public/shared.
*/

CREATE TABLE IF NOT EXISTS "CompetitorHistory" (
  "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "competitorId"    uuid        NOT NULL REFERENCES "Competitor"("id") ON DELETE CASCADE,
  "year"            INTEGER     NOT NULL,
  "courseType"       TEXT,
  "price"           NUMERIC(10,2),
  "snapshotUrl"     TEXT        NOT NULL,
  "dataConfidence"  INTEGER     NOT NULL DEFAULT 80,
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "CompetitorHistory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_history" ON "CompetitorHistory";
CREATE POLICY "anon_select_history" ON "CompetitorHistory" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_history" ON "CompetitorHistory";
CREATE POLICY "anon_insert_history" ON "CompetitorHistory" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_history" ON "CompetitorHistory";
CREATE POLICY "anon_update_history" ON "CompetitorHistory" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_history" ON "CompetitorHistory";
CREATE POLICY "anon_delete_history" ON "CompetitorHistory" FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS "idx_history_competitor" ON "CompetitorHistory"("competitorId");
CREATE INDEX IF NOT EXISTS "idx_history_year" ON "CompetitorHistory"("year");