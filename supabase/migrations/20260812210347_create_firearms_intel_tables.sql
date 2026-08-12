/*
# Create Firearms Training Intelligence Tables

1. Purpose
   This dashboard tracks NJ firearms training providers, market forecasts,
   research reports, and data source logs. It is a single-tenant app with no
   sign-in screen, so all data is intentionally public/shared.

2. New Tables
   - "Competitor" — firearms training facilities/providers with location, pricing, and service data
   - "MarketForecast" — yearly enrollment and revenue projections by county
   - "ResearchReport" — market analysis reports with markdown content
   - "SourceLog" — data collection source tracking with status and record counts

3. Security
   - RLS enabled on all tables.
   - Anon + authenticated CRUD allowed because the data is intentionally public (no auth).
*/

-- Competitor table
CREATE TABLE IF NOT EXISTS "Competitor" (
  "id"                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  "facilityName"         TEXT          NOT NULL,
  "address"              TEXT          NOT NULL,
  "county"               TEXT          NOT NULL,
  "latitude"             NUMERIC(10,6) NOT NULL,
  "longitude"            NUMERIC(10,6) NOT NULL,
  "facilityType"         TEXT          NOT NULL,
  "ownerOperator"        TEXT,
  "website"              TEXT          NOT NULL DEFAULT '',
  "phone"                TEXT          NOT NULL DEFAULT '',
  "servicesOffered"      TEXT          NOT NULL DEFAULT '',
  "capacity"             TEXT,
  "lanes"                INTEGER,
  "membershipOptions"    TEXT,
  "instructorCredentials" TEXT,
  "basicHandgunPrice"    NUMERIC(10,2),
  "ccwPrepPrice"         NUMERIC(10,2),
  "laneFee"              NUMERIC(10,2),
  "privateLessonRate"    NUMERIC(10,2),
  "dataConfidence"       INTEGER       NOT NULL DEFAULT 90,
  "needsVerification"    BOOLEAN       NOT NULL DEFAULT FALSE,
  "sourceUrl"            TEXT          NOT NULL DEFAULT '',
  "dateAccessed"         TIMESTAMPTZ   NOT NULL,
  "notes"                TEXT,
  "createdAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "Competitor" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_competitor" ON "Competitor";
CREATE POLICY "anon_select_competitor" ON "Competitor" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_competitor" ON "Competitor";
CREATE POLICY "anon_insert_competitor" ON "Competitor" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_competitor" ON "Competitor";
CREATE POLICY "anon_update_competitor" ON "Competitor" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_competitor" ON "Competitor";
CREATE POLICY "anon_delete_competitor" ON "Competitor" FOR DELETE
  TO anon, authenticated USING (true);

-- MarketForecast table
CREATE TABLE IF NOT EXISTS "MarketForecast" (
  "id"                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  "year"                 INTEGER       NOT NULL,
  "projectedEnrollments" INTEGER       NOT NULL,
  "estimatedRevenue"     NUMERIC(15,2) NOT NULL,
  "county"               TEXT,
  "createdAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE "MarketForecast" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_forecast" ON "MarketForecast";
CREATE POLICY "anon_select_forecast" ON "MarketForecast" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_forecast" ON "MarketForecast";
CREATE POLICY "anon_insert_forecast" ON "MarketForecast" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_forecast" ON "MarketForecast";
CREATE POLICY "anon_update_forecast" ON "MarketForecast" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_forecast" ON "MarketForecast";
CREATE POLICY "anon_delete_forecast" ON "MarketForecast" FOR DELETE
  TO anon, authenticated USING (true);

-- ResearchReport table
CREATE TABLE IF NOT EXISTS "ResearchReport" (
  "id"               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"            TEXT        NOT NULL,
  "reportDate"       TIMESTAMPTZ NOT NULL,
  "contentMarkdown"  TEXT        NOT NULL,
  "executiveSummary" TEXT        NOT NULL,
  "pdfDownloadUrl"   TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "ResearchReport" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_report" ON "ResearchReport";
CREATE POLICY "anon_select_report" ON "ResearchReport" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_report" ON "ResearchReport";
CREATE POLICY "anon_insert_report" ON "ResearchReport" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_report" ON "ResearchReport";
CREATE POLICY "anon_update_report" ON "ResearchReport" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_report" ON "ResearchReport";
CREATE POLICY "anon_delete_report" ON "ResearchReport" FOR DELETE
  TO anon, authenticated USING (true);

-- SourceLog table
CREATE TABLE IF NOT EXISTS "SourceLog" (
  "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "sourceName"      TEXT        NOT NULL,
  "status"          TEXT        NOT NULL,
  "recordsFound"    INTEGER     NOT NULL DEFAULT 0,
  "lastScrapeDate"  TIMESTAMPTZ NOT NULL,
  "sourceUrl"       TEXT,
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "SourceLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sourcelog" ON "SourceLog";
CREATE POLICY "anon_select_sourcelog" ON "SourceLog" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sourcelog" ON "SourceLog";
CREATE POLICY "anon_insert_sourcelog" ON "SourceLog" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sourcelog" ON "SourceLog";
CREATE POLICY "anon_update_sourcelog" ON "SourceLog" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sourcelog" ON "SourceLog";
CREATE POLICY "anon_delete_sourcelog" ON "SourceLog" FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_competitor_county" ON "Competitor"("county");
CREATE INDEX IF NOT EXISTS "idx_competitor_type" ON "Competitor"("facilityType");
CREATE INDEX IF NOT EXISTS "idx_marketforecast_year" ON "MarketForecast"("year");
CREATE INDEX IF NOT EXISTS "idx_sourcelog_status" ON "SourceLog"("status");