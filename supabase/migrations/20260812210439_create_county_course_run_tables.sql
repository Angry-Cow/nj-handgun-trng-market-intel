/*
# Create County, CourseOffering, DataCollectionRun Tables

These tables support the firearms training intelligence dashboard.
No auth screen — data is intentionally public/shared.
*/

-- County table
CREATE TABLE IF NOT EXISTS "County" (
  "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "county"    TEXT NOT NULL,
  "state"     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("county", "state")
);

ALTER TABLE "County" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_county" ON "County";
CREATE POLICY "anon_select_county" ON "County" FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_county" ON "County";
CREATE POLICY "anon_insert_county" ON "County" FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_county" ON "County";
CREATE POLICY "anon_update_county" ON "County" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_county" ON "County";
CREATE POLICY "anon_delete_county" ON "County" FOR DELETE
  TO anon, authenticated USING (true);

-- CourseOffering table
CREATE TABLE IF NOT EXISTS "CourseOffering" (
  "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "competitorId"         uuid NOT NULL REFERENCES "Competitor"("id") ON DELETE CASCADE,
  "courseName"           TEXT NOT NULL,
  "courseType"           TEXT NOT NULL,
  "price"                NUMERIC(10,2),
  "durationHours"        NUMERIC(5,1),
  "durationDescription"  TEXT,
  "classCapacity"        INTEGER,
  "certificationBody"    TEXT,
  "dataConfidence"       INTEGER NOT NULL DEFAULT 90,
  "needsVerification"    BOOLEAN NOT NULL DEFAULT FALSE,
  "notes"                TEXT,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "CourseOffering" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_course" ON "CourseOffering";
CREATE POLICY "anon_select_course" ON "CourseOffering" FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_course" ON "CourseOffering";
CREATE POLICY "anon_insert_course" ON "CourseOffering" FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_course" ON "CourseOffering";
CREATE POLICY "anon_update_course" ON "CourseOffering" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_course" ON "CourseOffering";
CREATE POLICY "anon_delete_course" ON "CourseOffering" FOR DELETE
  TO anon, authenticated USING (true);

-- DataCollectionRun table
CREATE TABLE IF NOT EXISTS "DataCollectionRun" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "runDate"                  TIMESTAMPTZ NOT NULL,
  "status"                   TEXT NOT NULL DEFAULT 'pending',
  "countiesIncluded"         TEXT NOT NULL DEFAULT '[]',
  "providerTypesIncluded"    TEXT NOT NULL DEFAULT '[]',
  "yearRangeStart"           INTEGER,
  "yearRangeEnd"             INTEGER,
  "triggeredBy"              TEXT NOT NULL DEFAULT 'manual',
  "totalProvidersScanned"    INTEGER NOT NULL DEFAULT 0,
  "newRecordsCreated"        INTEGER NOT NULL DEFAULT 0,
  "recordsUpdated"           INTEGER NOT NULL DEFAULT 0,
  "recordsFlagged"           INTEGER NOT NULL DEFAULT 0,
  "errorLog"                 TEXT,
  "notes"                    TEXT,
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "DataCollectionRun" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_run" ON "DataCollectionRun";
CREATE POLICY "anon_select_run" ON "DataCollectionRun" FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_run" ON "DataCollectionRun";
CREATE POLICY "anon_insert_run" ON "DataCollectionRun" FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_run" ON "DataCollectionRun";
CREATE POLICY "anon_update_run" ON "DataCollectionRun" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_run" ON "DataCollectionRun";
CREATE POLICY "anon_delete_run" ON "DataCollectionRun" FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_course_competitor" ON "CourseOffering"("competitorId");
CREATE INDEX IF NOT EXISTS "idx_county_state" ON "County"("state");
CREATE INDEX IF NOT EXISTS "idx_run_status" ON "DataCollectionRun"("status");