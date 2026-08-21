/*
# Blocklist generic directory entries and delete from Competitor

These are aggregator/directory pages, not actual facilities:
  - "Gun Stores Near ..."
  - "Gun Stores & FFL Dealers Near ..."
  - "Gun Dealers near ..."
*/

-- Add to blocklist first
INSERT INTO "DeletedCompetitor" ("facilityName", "address", "county", "normalizedName")
VALUES
  ('Gun Dealers near Somerset, NJ', 'Somerset, New Jersey', 'Somerset', 'gundealersnearsomersetnj'),
  ('246 Gun Stores & FFL Dealers Near Bound Brook, NJ', 'Middlesex, New Jersey', 'Middlesex', '246gunstoresffldealersnearboundbrooknj'),
  ('181 Gun Stores Near Passaic, NJ - Updated June 2026', 'Passaic, New Jersey', 'Passaic', '181gunstoresnearpassaicnjupdatedjune2026'),
  ('Gun Dealers near New Castle, DE | Better Business Bureau', 'New Castle, Delaware', 'New Castle', 'gundealersnearnewcastledbetterbusinessbureau')
ON CONFLICT DO NOTHING;

-- Delete from Competitor
DELETE FROM "Competitor"
WHERE "facilityName" ILIKE '%Gun Stores Near%'
   OR "facilityName" ILIKE '%Gun Stores & FFL Dealers Near%'
   OR "facilityName" ILIKE '%Gun Dealers near%';
