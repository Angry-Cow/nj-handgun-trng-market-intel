/*
# Merge leftover duplicate competitors with near-matching names

The original merge grouped by exact name+county+address, so entries with
slightly different names (truncation, suffixes) were missed. This migration
manually merges 19 known pairs: the "best" row keeps a combined facilityType,
the other is deleted and added to the DeletedCompetitor blocklist.
*/

DO $$
DECLARE
  -- (keep_id, delete_id, combined_type)
  pairs uuid[][] := ARRAY[
    -- Classic Pistol: keep full name (gun club, retailer), delete truncated (range)
    ARRAY['779d0491-738c-4efb-862e-dd31e461fce1'::uuid, '2a032513-dd48-46b3-a07f-5c474c691f1e'::uuid],
    -- bucks county fish and game: keep clean name (gun club, 90), delete verbose (range)
    ARRAY['5c71c8e7-cce5-48ad-b404-9cea1a73bfa5'::uuid, '126ea6b4-2f02-4b7c-8aa1-5973138f52e4'::uuid],
    -- Easton Fish and Game: keep clean name (gun club, 80), delete verbose (range)
    ARRAY['997ee878-2b64-4057-afe3-15e91451366c'::uuid, 'bd974120-522c-4f6c-87d9-9dc27a9c7ebe'::uuid],
    -- Gun For Hire: keep (range, 90), delete (range, 65)
    ARRAY['478487e9-2e23-46ab-aaba-f8f6a777b6c3'::uuid, '15363791-344e-47de-b0e2-9a13488857ff'::uuid],
    -- Hellertown Sportsmen: keep (gun club, 80), delete (range, 65)
    ARRAY['fc42908e-4a47-42c6-b8da-5c47db5b6f0d'::uuid, 'f5e57b08-1822-40d8-9355-902965112cc3'::uuid],
    -- Keystone Rod & Gun: keep fuller name (range), delete (gun club)
    ARRAY['5f7a76d5-7d3e-40fe-a733-50a8011c0f1e'::uuid, '27a4428c-2228-4b95-bc02-e1095cc1c2d5'::uuid],
    -- lappawinzo fish & game: keep clean name (gun club), delete verbose (range)
    ARRAY['dd8488cf-8e55-40d6-98a8-7c0812543929'::uuid, '541c0639-ad03-4acf-ad42-37080263c351'::uuid],
    -- Long Shot Pistol and Rifle: keep (range, 80), delete (range, 65)
    ARRAY['8b2be9c4-df06-4892-a8a1-53ef666ea4bb'::uuid, 'cb6626e1-999d-4c68-9c40-2d315f7c62dd'::uuid],
    -- NJ Shooting Ranges Directory: keep (range, 75), delete (gun club, 65)
    ARRAY['cd085a11-d76d-4b90-92bb-b28e208498c0'::uuid, '8b97f5e6-81ec-41fc-9144-edd5aa12a141'::uuid],
    -- Passaic County Sheriff's: keep fuller name (gun club), delete truncated (range)
    ARRAY['72468c77-45d6-4b02-8ed2-1c6dc4e0e04a'::uuid, '72a49512-72f0-4780-aa86-13e273963375'::uuid],
    -- Philadelphia Gun Club: keep clean name (gun club), delete verbose (gun club)
    ARRAY['02620af6-308b-4199-b278-867fc3d55d94'::uuid, '73d1256b-b32a-4a13-9f81-0542de571982'::uuid],
    -- Private gun club Blackwood: keep fuller name (gun club), delete truncated (range)
    ARRAY['3c995575-0d75-4df9-ba68-b34890d3e218'::uuid, '3aac65da-fe12-4a93-8cc8-ad21f665936e'::uuid],
    -- Reloaderz NJ: keep (range, 85), delete (range, 65)
    ARRAY['b8273ff8-708e-42fd-8b30-70b6e1c6a600'::uuid, '0c62dc19-b60c-43b6-9965-aaeec7b115f8'::uuid],
    -- RTSP Range: keep (retailer, 90), delete (range, 65)
    ARRAY['c26e0a8e-f4ee-4786-b9a2-1afb18715e69'::uuid, '0128cf12-fab6-40bf-885e-479e946dc9a4'::uuid],
    -- Somerset County Fish and Game: keep clean name (gun club), delete verbose (private instructor)
    ARRAY['40633985-d733-4f33-856b-f7b9a56d641e'::uuid, '14a00819-0e0a-44d6-a711-ce2d8c8381c6'::uuid],
    -- Sussex County shooting range: keep fuller name (gun club), delete (range)
    ARRAY['3cd63be5-1f44-4245-a6f7-097c2832fc84'::uuid, '05a94fab-1fcd-4883-b9bd-3b4021403400'::uuid],
    -- Tenafly Rifle & Pistol Club: keep first (range, 65), delete second (range, 65)
    ARRAY['60e59197-49e5-41e1-9b41-2259ea00dced'::uuid, '7a58ca20-011b-4a7d-9cd0-35047f832228'::uuid],
    -- THE 15 BEST NJ Shooting Ranges: keep clean name (range), delete verbose (range)
    ARRAY['a93e02f7-1367-4d07-be1a-864c4f59d9ce'::uuid, '3426bef8-6dbf-4f9b-bddc-b12d5d86ad41'::uuid],
    -- Top Firearms Training: keep fuller name (private instructor), delete (range)
    ARRAY['d548ac1c-6aa5-4567-89de-0e511da9bc92'::uuid, '368a6e86-c100-4618-a4c4-d46804820976'::uuid],
    -- Wicen's Shooting Range: keep clean name (range, 90), delete verbose (range, 80)
    ARRAY['813cab18-517e-495a-aa63-565c48106c2b'::uuid, '56397073-664c-475b-80cf-03911d433efb'::uuid]
  ];
  keep_id uuid;
  del_id uuid;
  all_types text;
  del_record RECORD;
BEGIN
  FOR i IN 1..array_length(pairs, 1) LOOP
    keep_id := pairs[i][1];
    del_id := pairs[i][2];

    -- Build combined facilityType from both rows
    SELECT string_agg(DISTINCT "facilityType", ', ' ORDER BY "facilityType")
    INTO all_types
    FROM "Competitor"
    WHERE "id" IN (keep_id, del_id);

    -- Update the kept row with combined type
    UPDATE "Competitor"
    SET "facilityType" = all_types,
        "updatedAt" = now()
    WHERE "id" = keep_id;

    -- Grab the record being deleted for the blocklist
    SELECT * INTO del_record FROM "Competitor" WHERE "id" = del_id;

    -- Add to blocklist
    INSERT INTO "DeletedCompetitor" ("facilityName", "address", "county", "normalizedName")
    VALUES (
      del_record."facilityName",
      del_record."address",
      del_record."county",
      lower(regexp_replace(del_record."facilityName", '[^a-z0-9]', '', 'g'))
    )
    ON CONFLICT DO NOTHING;

    -- Delete the duplicate
    DELETE FROM "Competitor" WHERE "id" = del_id;
  END LOOP;
END $$;
