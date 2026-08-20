/*
# Create StateBoundingBox table

1. New Tables
- `StateBoundingBox`
  - `id` (uuid, primary key)
  - `state` (text, unique, not null) — full state name (e.g. "New Jersey")
  - `west` (double precision, not null) — western longitude boundary
  - `north` (double precision, not null) — northern latitude boundary
  - `east` (double precision, not null) — eastern longitude boundary
  - `south` (double precision, not null) — southern latitude boundary
  - `createdAt` (timestamptz, default now())
  - `updatedAt` (timestamptz, default now())

2. Purpose
- Stores per-state geographic bounding boxes used by the firecrawl-scan edge
  function for Nominatim viewbox filtering. Previously these were hardcoded in
  the edge function; now they live in the database so new states can be added
  from the UI without a code change.

3. Seed Data
- New Jersey: [-75.6, 41.4, -73.9, 38.9]
- Pennsylvania: [-80.5, 42.3, -74.7, 39.7]

4. Security
- Enable RLS on `StateBoundingBox`.
- Allow anon + authenticated CRUD (single-tenant, no-auth app — data is
  intentionally shared/public so the dashboard can read and write bounding
  boxes via the anon key).
*/

CREATE TABLE IF NOT EXISTS "StateBoundingBox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state" text UNIQUE NOT NULL,
  "west" double precision NOT NULL,
  "north" double precision NOT NULL,
  "east" double precision NOT NULL,
  "south" double precision NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "StateBoundingBox" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_state_bbox" ON "StateBoundingBox";
CREATE POLICY "anon_select_state_bbox" ON "StateBoundingBox" FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_state_bbox" ON "StateBoundingBox";
CREATE POLICY "anon_insert_state_bbox" ON "StateBoundingBox" FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_state_bbox" ON "StateBoundingBox";
CREATE POLICY "anon_update_state_bbox" ON "StateBoundingBox" FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_state_bbox" ON "StateBoundingBox";
CREATE POLICY "anon_delete_state_bbox" ON "StateBoundingBox" FOR DELETE
  TO anon, authenticated USING (true);

-- Seed existing states
INSERT INTO "StateBoundingBox" ("state", "west", "north", "east", "south")
VALUES
  ('New Jersey', -75.6, 41.4, -73.9, 38.9),
  ('Pennsylvania', -80.5, 42.3, -74.7, 39.7)
ON CONFLICT ("state") DO NOTHING;
