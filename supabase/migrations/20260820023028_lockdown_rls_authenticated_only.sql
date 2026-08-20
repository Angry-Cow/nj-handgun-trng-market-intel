/*
# Lock down all RLS policies to authenticated-only

## Summary
The entire app is moving behind a login wall. Every table currently allows
full anonymous CRUD via the public anon key. This migration changes ALL policies
on ALL tables from `TO anon, authenticated` to `TO authenticated` only, and
revokes all table privileges from the `anon` role.

## What changes
- For every table (Competitor, CompetitorHistory, County, CourseOffering,
  DataCollectionRun, IndustryIndicator, MarketForecast, ResearchReport,
  SourceLog, StateBoundingBox):
  - Drop all existing policies
  - Recreate SELECT/INSERT/UPDATE/DELETE policies scoped to `TO authenticated`
  - Revoke all privileges from the `anon` role
  - Grant full CRUD to the `authenticated` role

## Security
- After this migration, an unauthenticated request using only the anon key
  will receive zero rows on SELECT and a policy violation on INSERT/UPDATE/DELETE.
- Only a logged-in user (authenticated role) can read or write any data.

## Notes
1. This is a single-user admin app — no user_id columns or ownership checks.
   Any authenticated user has full access to all data.
2. No table structure or data is changed — only policies and grants.
3. The `anon` role loses ALL privileges on ALL tables.
*/

-- ─── Competitor ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_competitor" ON "Competitor";
DROP POLICY IF EXISTS "anon_insert_competitor" ON "Competitor";
DROP POLICY IF EXISTS "anon_update_competitor" ON "Competitor";
DROP POLICY IF EXISTS "anon_delete_competitor" ON "Competitor";

CREATE POLICY "auth_select_competitor" ON "Competitor" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_competitor" ON "Competitor" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_competitor" ON "Competitor" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_competitor" ON "Competitor" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "Competitor" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Competitor" TO authenticated;

-- ─── CompetitorHistory ────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_history" ON "CompetitorHistory";
DROP POLICY IF EXISTS "anon_insert_history" ON "CompetitorHistory";
DROP POLICY IF EXISTS "anon_update_history" ON "CompetitorHistory";
DROP POLICY IF EXISTS "anon_delete_history" ON "CompetitorHistory";

CREATE POLICY "auth_select_history" ON "CompetitorHistory" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_history" ON "CompetitorHistory" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_history" ON "CompetitorHistory" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_history" ON "CompetitorHistory" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "CompetitorHistory" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "CompetitorHistory" TO authenticated;

-- ─── County ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_county" ON "County";
DROP POLICY IF EXISTS "anon_insert_county" ON "County";
DROP POLICY IF EXISTS "anon_update_county" ON "County";
DROP POLICY IF EXISTS "anon_delete_county" ON "County";

CREATE POLICY "auth_select_county" ON "County" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_county" ON "County" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_county" ON "County" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_county" ON "County" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "County" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "County" TO authenticated;

-- ─── CourseOffering ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_course" ON "CourseOffering";

CREATE POLICY "auth_select_course" ON "CourseOffering" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_course" ON "CourseOffering" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_course" ON "CourseOffering" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_course" ON "CourseOffering" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "CourseOffering" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "CourseOffering" TO authenticated;

-- ─── DataCollectionRun ────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_run" ON "DataCollectionRun";
DROP POLICY IF EXISTS "anon_insert_run" ON "DataCollectionRun";
DROP POLICY IF EXISTS "anon_update_run" ON "DataCollectionRun";
DROP POLICY IF EXISTS "anon_delete_run" ON "DataCollectionRun";

CREATE POLICY "auth_select_run" ON "DataCollectionRun" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_run" ON "DataCollectionRun" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_run" ON "DataCollectionRun" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_run" ON "DataCollectionRun" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "DataCollectionRun" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "DataCollectionRun" TO authenticated;

-- ─── IndustryIndicator ───────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_indicators" ON "IndustryIndicator";
DROP POLICY IF EXISTS "anon_insert_indicators" ON "IndustryIndicator";
DROP POLICY IF EXISTS "anon_update_indicators" ON "IndustryIndicator";
DROP POLICY IF EXISTS "anon_delete_indicators" ON "IndustryIndicator";

CREATE POLICY "auth_select_indicators" ON "IndustryIndicator" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_indicators" ON "IndustryIndicator" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_indicators" ON "IndustryIndicator" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_indicators" ON "IndustryIndicator" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "IndustryIndicator" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "IndustryIndicator" TO authenticated;

-- ─── MarketForecast ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_forecast" ON "MarketForecast";
DROP POLICY IF EXISTS "anon_insert_forecast" ON "MarketForecast";

CREATE POLICY "auth_select_forecast" ON "MarketForecast" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_forecast" ON "MarketForecast" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_forecast" ON "MarketForecast" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_forecast" ON "MarketForecast" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "MarketForecast" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "MarketForecast" TO authenticated;

-- ─── ResearchReport ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_report" ON "ResearchReport";
DROP POLICY IF EXISTS "anon_insert_report" ON "ResearchReport";

CREATE POLICY "auth_select_report" ON "ResearchReport" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_report" ON "ResearchReport" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_report" ON "ResearchReport" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_report" ON "ResearchReport" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "ResearchReport" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ResearchReport" TO authenticated;

-- ─── SourceLog ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_sourcelog" ON "SourceLog";
DROP POLICY IF EXISTS "anon_insert_sourcelog" ON "SourceLog";

CREATE POLICY "auth_select_sourcelog" ON "SourceLog" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_sourcelog" ON "SourceLog" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sourcelog" ON "SourceLog" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sourcelog" ON "SourceLog" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "SourceLog" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "SourceLog" TO authenticated;

-- ─── StateBoundingBox ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_state_bbox" ON "StateBoundingBox";
DROP POLICY IF EXISTS "anon_insert_state_bbox" ON "StateBoundingBox";
DROP POLICY IF EXISTS "anon_update_state_bbox" ON "StateBoundingBox";
DROP POLICY IF EXISTS "anon_delete_state_bbox" ON "StateBoundingBox";

CREATE POLICY "auth_select_state_bbox" ON "StateBoundingBox" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_state_bbox" ON "StateBoundingBox" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_state_bbox" ON "StateBoundingBox" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_state_bbox" ON "StateBoundingBox" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "StateBoundingBox" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "StateBoundingBox" TO authenticated;