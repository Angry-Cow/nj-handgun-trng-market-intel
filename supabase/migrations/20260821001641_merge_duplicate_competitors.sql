/*
# Merge duplicate competitors by name + county

Combines entries that share the same facility name + county but differ only
in facilityType. The "best" row (highest dataConfidence, then most services)
is kept; its facilityType is replaced with a comma-separated list of all
distinct types from the group. The remaining rows are deleted.

Facilities in different counties (e.g. RTSP) remain separate because county
is part of the grouping key.
*/

DO $$
DECLARE
  dup RECORD;
  keep_id uuid;
  keep_type text;
  all_types text;
BEGIN
  FOR dup IN
    SELECT "facilityName", "county", "address"
    FROM "Competitor"
    GROUP BY "facilityName", "county", "address"
    HAVING count(*) > 1
  LOOP
    -- Find the "best" row: highest confidence, then most services (longest string), then earliest created
    SELECT c."id" INTO keep_id
    FROM "Competitor" c
    WHERE c."facilityName" = dup."facilityName"
      AND c."county" = dup."county"
      AND c."address" = dup."address"
    ORDER BY c."dataConfidence" DESC NULLS LAST,
             length(coalesce(c."servicesOffered", '')) DESC,
             c."createdAt" ASC
    LIMIT 1;

    -- Build comma-separated list of distinct types (in a stable order)
    SELECT string_agg(DISTINCT "facilityType", ', ' ORDER BY "facilityType")
    INTO all_types
    FROM "Competitor"
    WHERE "facilityName" = dup."facilityName"
      AND "county" = dup."county"
      AND "address" = dup."address";

    -- Update the kept row with the combined type
    UPDATE "Competitor"
    SET "facilityType" = all_types,
        "updatedAt" = now()
    WHERE "id" = keep_id;

    -- Delete all other rows in the group
    DELETE FROM "Competitor"
    WHERE "facilityName" = dup."facilityName"
      AND "county" = dup."county"
      AND "address" = dup."address"
      AND "id" <> keep_id;
  END LOOP;
END $$;