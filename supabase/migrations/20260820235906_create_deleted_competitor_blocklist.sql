/*
# Deleted competitor blocklist

Tracks competitors that were manually deleted so they don't get re-added
on future scan runs. The key is the combination of normalized facility name
+ county, since the core problem is entries being misclassified into the
wrong county by overlapping scan grids.

## Schema
- facilityName   — the original facility name (kept for display)
- address        — the full address at time of deletion
- county         — the county the entry was in when deleted (the wrong county)
- normalizedName — pre-computed lowercase alphanumeric name for matching
- deletedAt      — timestamp of deletion

## RLS
- authenticated-only CRUD (same as all other tables)
*/

CREATE TABLE "DeletedCompetitor" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facilityName" text NOT NULL,
  "address" text,
  "county" text NOT NULL,
  "normalizedName" text NOT NULL,
  "deletedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "DeletedCompetitor" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_deleted_competitor" ON "DeletedCompetitor" FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "auth_insert_deleted_competitor" ON "DeletedCompetitor" FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_deleted_competitor" ON "DeletedCompetitor" FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_deleted_competitor" ON "DeletedCompetitor" FOR DELETE
  TO authenticated USING (true);

REVOKE ALL ON "DeletedCompetitor" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "DeletedCompetitor" TO authenticated;

CREATE INDEX "idx_deleted_competitor_normalized_name" ON "DeletedCompetitor" ("normalizedName");
CREATE INDEX "idx_deleted_competitor_county" ON "DeletedCompetitor" ("county");