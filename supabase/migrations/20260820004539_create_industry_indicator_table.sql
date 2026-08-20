/*
# Create IndustryIndicator table for manual market-level data entry

1. Purpose
   Stores manually-entered industry-level indicators (e.g., NJ permit application
   counts, NICS background check volumes, market-wide trends) that contextualize
   the competitor-level data. One row per indicator per period.

2. New Tables
   - "IndustryIndicator"
     - id              (uuid, primary key)
     - indicatorName   (text, not null) — e.g., "NJ Handgun Permit Applications"
     - indicatorValue  (numeric, not null) — the numeric value for this period
     - unit            (text) — e.g., "applications", "%", "checks"
     - period          (text, not null) — e.g., "2025-Q1", "2025-08", "2025"
     - periodType      (text, not null) — 'monthly' | 'quarterly' | 'annual'
     - sourceName      (text) — where the data came from
     - sourceUrl       (text) — link to the source
     - notes           (text) — analyst notes
     - dataConfidence  (integer, default 90) — confidence score
     - createdAt       (timestamptz)
     - updatedAt       (timestamptz)

3. Security
   - Enable RLS on "IndustryIndicator".
   - Same no-auth pattern as all other tables: anon + authenticated CRUD,
     data is intentionally public/shared.

4. Indexes
   - Index on period for filtering by time period.
   - Index on indicatorName for grouping by indicator type.
*/

CREATE TABLE IF NOT EXISTS "IndustryIndicator" (
  "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "indicatorName"   TEXT        NOT NULL,
  "indicatorValue"  NUMERIC(14,2) NOT NULL,
  "unit"            TEXT,
  "period"          TEXT        NOT NULL,
  "periodType"      TEXT        NOT NULL DEFAULT 'annual',
  "sourceName"      TEXT,
  "sourceUrl"       TEXT,
  "notes"           TEXT,
  "dataConfidence"  INTEGER     NOT NULL DEFAULT 90,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "IndustryIndicator" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_indicators" ON "IndustryIndicator";
CREATE POLICY "anon_select_indicators" ON "IndustryIndicator" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_indicators" ON "IndustryIndicator";
CREATE POLICY "anon_insert_indicators" ON "IndustryIndicator" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_indicators" ON "IndustryIndicator";
CREATE POLICY "anon_update_indicators" ON "IndustryIndicator" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_indicators" ON "IndustryIndicator";
CREATE POLICY "anon_delete_indicators" ON "IndustryIndicator" FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS "idx_indicators_period" ON "IndustryIndicator"("period");
CREATE INDEX IF NOT EXISTS "idx_indicators_name" ON "IndustryIndicator"("indicatorName");
