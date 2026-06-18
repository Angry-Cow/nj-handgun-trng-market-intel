-- =============================================================================
-- DATABASE EXPORT SCRIPT
-- Project : NJ Firearms Training Intelligence Dashboard
-- Generated: 2026-04-09
-- Target   : PostgreSQL (ANSI-compatible; works on MySQL 8+, SQLite with minor
--             adjustments noted inline)
-- Usage    : psql -U <user> -d <database> -f database_export.sql
-- Notes    :
--   • All UUIDs are stored as TEXT for maximum portability. Cast to UUID in
--     PostgreSQL with  id::uuid  if you prefer the native type.
--   • Timestamps are stored as TIMESTAMPTZ (UTC). Adjust to TIMESTAMP if your
--     target DB does not support time-zones.
--   • ON CONFLICT DO NOTHING handles re-runs gracefully (duplicate-safe).
--   • createdByUserId is informational only; no FK to a users table is created
--     here because that table lives in the auth layer, not this schema.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. OPTIONAL: create a fresh schema to isolate this data
-- ---------------------------------------------------------------------------
-- CREATE SCHEMA IF NOT EXISTS firearms_intel;
-- SET search_path = firearms_intel, public;

-- ---------------------------------------------------------------------------
-- 1. TABLE DEFINITIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "County" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "county"          TEXT        NOT NULL,
  "state"           TEXT        NOT NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByUserId" TEXT
);

CREATE TABLE IF NOT EXISTS "Competitor" (
  "id"                   TEXT          NOT NULL PRIMARY KEY,
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
  "updatedAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "createdByUserId"      TEXT
);

CREATE TABLE IF NOT EXISTS "MarketForecast" (
  "id"                   TEXT          NOT NULL PRIMARY KEY,
  "year"                 INTEGER       NOT NULL,
  "projectedEnrollments" INTEGER       NOT NULL,
  "estimatedRevenue"     NUMERIC(15,2) NOT NULL,
  "county"               TEXT,
  "createdAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "createdByUserId"      TEXT
);

CREATE TABLE IF NOT EXISTS "ResearchReport" (
  "id"               TEXT        NOT NULL PRIMARY KEY,
  "title"            TEXT        NOT NULL,
  "reportDate"       TIMESTAMPTZ NOT NULL,
  "contentMarkdown"  TEXT        NOT NULL,
  "executiveSummary" TEXT        NOT NULL,
  "pdfDownloadUrl"   TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByUserId"  TEXT
);

CREATE TABLE IF NOT EXISTS "SourceLog" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "sourceName"      TEXT        NOT NULL,
  "status"          TEXT        NOT NULL,
  "recordsFound"    INTEGER     NOT NULL DEFAULT 0,
  "lastScrapeDate"  TIMESTAMPTZ NOT NULL,
  "sourceUrl"       TEXT,
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByUserId" TEXT
);

CREATE TABLE IF NOT EXISTS "CourseOffering" (
  "id"                  TEXT          NOT NULL PRIMARY KEY,
  "competitorId"        TEXT          NOT NULL,
  "courseName"          TEXT          NOT NULL,
  "courseType"          TEXT          NOT NULL,
  "durationHours"       NUMERIC(5,2),
  "durationDescription" TEXT,
  "classCapacity"       INTEGER,
  "price"               NUMERIC(10,2),
  "certificationBody"   TEXT,
  "notes"               TEXT,
  "dataConfidence"      INTEGER       NOT NULL DEFAULT 90,
  "needsVerification"   BOOLEAN       NOT NULL DEFAULT FALSE,
  "sourceUrl"           TEXT          NOT NULL DEFAULT '',
  "dateAccessed"        TIMESTAMPTZ   NOT NULL,
  "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "createdByUserId"     TEXT,
  CONSTRAINT "fk_courseoffering_competitor"
    FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "DataCollectionRun" (
  "id"                     TEXT        NOT NULL PRIMARY KEY,
  "runDate"                TIMESTAMPTZ NOT NULL,
  "status"                 TEXT        NOT NULL,
  "countiesIncluded"       TEXT        NOT NULL,
  "providerTypesIncluded"  TEXT        NOT NULL,
  "yearRangeStart"         INTEGER     NOT NULL,
  "yearRangeEnd"           INTEGER     NOT NULL,
  "totalProvidersScanned"  INTEGER,
  "newRecordsCreated"      INTEGER,
  "recordsUpdated"         INTEGER,
  "recordsFlagged"         INTEGER,
  "errorLog"               TEXT,
  "triggeredBy"            TEXT        NOT NULL,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByUserId"        TEXT
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES (optional but recommended)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "idx_competitor_county"   ON "Competitor"("county");
CREATE INDEX IF NOT EXISTS "idx_competitor_type"     ON "Competitor"("facilityType");
CREATE INDEX IF NOT EXISTS "idx_courseoffering_comp" ON "CourseOffering"("competitorId");
CREATE INDEX IF NOT EXISTS "idx_marketforecast_year" ON "MarketForecast"("year");
CREATE INDEX IF NOT EXISTS "idx_sourcelog_status"    ON "SourceLog"("status");
CREATE INDEX IF NOT EXISTS "idx_county_state"        ON "County"("state");

-- ---------------------------------------------------------------------------
-- 3. DATA — County
-- ---------------------------------------------------------------------------

INSERT INTO "County" ("id","county","state","createdAt","updatedAt","createdByUserId") VALUES
  ('0adf5442-50ae-400d-aee7-5afe9ed9ac00','Bergen','New Jersey','2026-04-05T13:56:35Z','2026-04-05T13:56:35Z','69c2f5958256d2186c632dec'),
  ('ac39cd2b-41f3-4b7d-b5b0-d2dd690d6a9f','Essex','New Jersey','2026-04-05T13:56:37Z','2026-04-05T13:56:37Z','69c2f5958256d2186c632dec'),
  ('aab3941e-2e98-4ae0-818d-6a571c69133a','Hudson','New Jersey','2026-04-05T13:56:37Z','2026-04-05T13:56:37Z','69c2f5958256d2186c632dec'),
  ('f746bc07-1639-4f9d-a9e5-f4aa33032352','Hunterdon','New Jersey','2026-04-05T13:56:38Z','2026-04-05T13:56:38Z','69c2f5958256d2186c632dec'),
  ('55f97988-35ed-4004-b0e8-d101742e3cc5','Mercer','New Jersey','2026-04-05T13:56:38Z','2026-04-05T13:56:38Z','69c2f5958256d2186c632dec'),
  ('cb9ff1d1-a1c7-464e-a3eb-dc16802e8545','Middlesex','New Jersey','2026-04-05T13:56:38Z','2026-04-05T13:56:38Z','69c2f5958256d2186c632dec'),
  ('8dd3cfb3-eb44-4082-8e57-053a3ae321cc','Monmouth','New Jersey','2026-04-05T13:56:38Z','2026-04-05T13:56:38Z','69c2f5958256d2186c632dec'),
  ('bf63ee18-5821-4e07-81dd-ad5cd9e4d646','Morris','New Jersey','2026-04-05T13:56:39Z','2026-04-05T13:56:39Z','69c2f5958256d2186c632dec'),
  ('a95319e5-991e-42bb-880a-261adf2befac','Passaic','New Jersey','2026-04-05T13:56:39Z','2026-04-05T13:56:39Z','69c2f5958256d2186c632dec'),
  ('35123257-25f7-4d97-a3c5-bd4ae7bd3cd7','Somerset','New Jersey','2026-04-05T13:56:40Z','2026-04-05T13:56:40Z','69c2f5958256d2186c632dec'),
  ('0717f34e-2cab-4666-b47f-1620921e9fc0','Sussex','New Jersey','2026-04-05T13:56:41Z','2026-04-05T13:56:41Z','69c2f5958256d2186c632dec'),
  ('7e24d328-5144-4def-974f-3c9f0cd9817c','Union','New Jersey','2026-04-05T13:56:41Z','2026-04-05T13:56:41Z','69c2f5958256d2186c632dec'),
  ('c9f35f32-48ee-47a1-bd21-556bcd731b92','Warren','New Jersey','2026-04-05T13:56:41Z','2026-04-05T13:56:41Z','69c2f5958256d2186c632dec'),
  ('0d9d42e8-634a-413c-9c46-993dde0b1e53','Northampton','Pennsylvania','2026-04-05T14:20:56Z','2026-04-05T14:30:17Z','69c2f5958256d2186c632dec'),
  ('78e139d6-e912-4e11-9a2e-d570902b552f','Bucks','Pennsylvania','2026-04-05T14:21:23Z','2026-04-05T14:21:23Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. DATA — Competitor
-- ---------------------------------------------------------------------------

INSERT INTO "Competitor" ("id","facilityName","address","county","latitude","longitude","facilityType","ownerOperator","website","phone","servicesOffered","capacity","lanes","membershipOptions","instructorCredentials","basicHandgunPrice","ccwPrepPrice","laneFee","privateLessonRate","dataConfidence","needsVerification","sourceUrl","dateAccessed","notes","createdAt","updatedAt","createdByUserId") VALUES
  ('65465cf7-58a2-481a-be50-3f39f6d63e5e','RTSP Randolph','730 State Route 10, Randolph, NJ 07869','Morris',40.8612,-74.579,'range',NULL,'https://www.rtspusa.com','(973) 446-1011','Basic Handgun, CCW Prep, Advanced, Private Lessons, Simulator','20 lanes',20,'Monthly and annual memberships available','NRA Certified, State-licensed instructors',75,200,25,100,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','Flagship location, full-service range and training center','2026-04-04T20:46:42Z','2026-04-04T20:46:42Z','69c2f5958256d2186c632dec'),
  ('85d1e61d-8483-4d8b-9455-a429cc8a0f1b','RTSP Union','2606 Morris Ave, Union, NJ 07083','Union',40.6976,-74.2627,'range',NULL,'https://www.rtspusa.com','(908) 687-7877','Basic Handgun, CCW Prep, Advanced, Private Lessons, Simulator','18 lanes',18,'Monthly and annual memberships available','NRA Certified, State-licensed instructors',75,200,25,100,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','Second RTSP location; same curriculum as Randolph','2026-04-04T20:46:42Z','2026-04-04T20:46:42Z','69c2f5958256d2186c632dec'),
  ('6b61bc5d-1704-4905-9109-1fdf752c91b3','Gun For Hire (Woodland Park Range)','831 Rte 46 W, Woodland Park, NJ 07424','Passaic',40.8873,-74.1937,'range',NULL,'https://gunforhire.com','(973) 357-0080','Basic Handgun, CCW Prep, Advanced, Women-only courses','35 lanes',35,'Annual memberships available','NRA Certified, active and retired law enforcement instructors',80,225,30,125,95,FALSE,'https://gunforhire.com/classes','2026-02-07T00:00:00Z','Largest indoor range in NJ; serving Essex/Passaic border','2026-04-04T20:46:43Z','2026-04-04T20:46:43Z','69c2f5958256d2186c632dec'),
  ('e5b8f610-57dd-45d9-bb27-90809458b270','Reloaderz NJ','1551 Route 23 N, Wayne, NJ 07470','Passaic',40.9529,-74.2677,'range',NULL,'https://reloaderzgun.com','(973) 790-0340','Basic Handgun, CCW Prep, Advanced, Private Lessons','15 lanes',15,'Membership plans available','NRA Certified instructors',70,195,22,95,93,FALSE,'https://reloaderzgun.com/classes','2026-02-07T00:00:00Z','Wayne location; serves Morris/Passaic border area','2026-04-04T20:46:43Z','2026-04-04T20:46:43Z','69c2f5958256d2186c632dec'),
  ('3f9c9cbb-fcd4-4714-b2f2-bf39a05328be','The Heritage Guild (Rahway)','1146 Main Ave, Clifton, NJ 07011','Union',40.601,-74.2776,'retailer',NULL,'https://heritageguildnj.com','(908) 925-1040','Basic Handgun, CCW Prep, NJ Permit-to-Purchase classes','In-store classroom',NULL,'None','NRA Certified instructors',60,175,NULL,90,92,TRUE,'https://heritageguildnj.com/training','2026-02-07T00:00:00Z','Retailer with in-house training; confirm current schedule','2026-04-04T20:46:43Z','2026-04-04T20:46:43Z','69c2f5958256d2186c632dec'),
  ('73419d1b-5bb4-4fa8-af40-ed271b7d3cb8','The Heritage Guild (Branchburg)','3440 US-22, Branchburg, NJ 08876','Somerset',40.5604,-74.7268,'range',NULL,'https://heritageguildnj.com','(908) 722-7700','Basic Handgun, CCW Prep, Private Lessons, Range Rental','12 lanes',12,'Annual memberships available','NRA Certified instructors',65,185,20,90,95,FALSE,'https://heritageguildnj.com/training','2026-02-07T00:00:00Z','Full range + retail; Somerset county anchor provider','2026-04-04T20:46:44Z','2026-04-04T20:46:44Z','69c2f5958256d2186c632dec'),
  ('75ac7ed5-df67-4606-9a47-78f520fe9030','Shore Shot Pistol Range','869 Cedar Bridge Ave, Brick Township, NJ 08723','Monmouth',40.0579,-74.1135,'range',NULL,'https://shoreshot.com','(732) 458-4800','Basic Handgun, CCW Prep, Beginner, Private Lessons','10 lanes',10,'Annual memberships available','NRA Certified instructors',55,160,18,80,94,FALSE,'https://shoreshot.com/training','2026-02-07T00:00:00Z','Lakewood/Brick area; serves southern Monmouth and Ocean','2026-04-04T20:46:44Z','2026-04-04T20:46:44Z','69c2f5958256d2186c632dec'),
  ('1fa4fd23-e1b5-42df-a7d6-cabe8aba935f','Cherry Ridge Range (ANJRPC)','120 Cherry Ridge Rd, West Milford, NJ 07480','Passaic',41.1154,-74.3537,'range',NULL,'https://anjrpc.org/cherry-ridge','(973) 728-1119','Basic Handgun, CCW Prep, Rifle, Pistol Competitions','Outdoor only',25,'ANJRPC membership required','NRA Certified instructors',40,140,15,75,94,FALSE,'https://anjrpc.org/cherry-ridge','2026-02-07T00:00:00Z','Largest outdoor facility in NJ; member-based access; Vernon/Morris area','2026-04-04T20:46:44Z','2026-04-05T01:56:59Z','69c2f5958256d2186c632dec'),
  ('96cb7bd8-6824-42b2-8009-4e2a4ebd5d12','Union Hill Gun Club','400 Union Hill Rd, Monroe Township, NJ 08831','Middlesex',40.3351,-74.4385,'gun club',NULL,'https://unionhillgunclub.com','(732) 521-0700','Basic Handgun, CCW Prep, Trap/Skeet, Private Lessons','Outdoor range',NULL,'Club membership required','NRA Certified instructors',50,175,15,75,93,FALSE,'https://unionhillgunclub.com','2026-02-07T00:00:00Z','Prominent Middlesex county gun club with active safety training program','2026-04-04T20:46:45Z','2026-04-04T20:46:45Z','69c2f5958256d2186c632dec'),
  ('9ba4cd1b-52b2-4398-8233-d1bf7a3affed','Bullet Hole','189 Washington Ave, Belleville, NJ 07109','Essex',40.7908,-74.1527,'range',NULL,'https://bulletholeshootingrange.com','(973) 759-7200','Basic Handgun, CCW Prep, Range Rental','12 lanes',12,'Individual and family memberships','NRA Certified instructors',45,120,17,70,92,TRUE,'https://bulletholeshootingrange.com','2026-02-07T00:00:00Z','Budget pricing tier; confirm CCW course schedule','2026-04-04T20:46:45Z','2026-04-04T20:46:45Z','69c2f5958256d2186c632dec'),
  ('f237c9e8-0262-4195-9f97-0084f3e2f67c','Old Bridge Rifle & Pistol Club','230 Ernston Rd, Sayreville, NJ 08872','Middlesex',40.4566,-74.3307,'gun club',NULL,'https://obrpc.com','(732) 254-3366','Basic Handgun, CCW Prep, Rifle, Pistol Competition','Outdoor range',NULL,'Club membership required','NRA Certified instructors',40,150,12,70,93,FALSE,'https://obrpc.com','2026-02-07T00:00:00Z','Long-standing club; active training calendar','2026-04-04T20:46:45Z','2026-04-04T20:46:45Z','69c2f5958256d2186c632dec'),
  ('89ecaf3f-c6c9-4193-b4bb-ac67b3d7a5e7','Central Jersey Rifle & Pistol Club','60 Federal Rd, Jackson, NJ 08527','Monmouth',40.0837,-74.3518,'gun club',NULL,'https://cjrpc.com','(732) 363-9396','Basic Handgun, CCW Prep, Rifle, Pistol Matches','Outdoor range',NULL,'Annual club membership','NRA Certified instructors',45,160,12,70,93,FALSE,'https://cjrpc.com','2026-02-07T00:00:00Z','Active match schedule; Monmouth/Ocean border area','2026-04-04T20:46:45Z','2026-04-04T20:46:45Z','69c2f5958256d2186c632dec'),
  ('b7492f64-1c4e-4048-af08-eb11d6714f4e','Griffin & Howe','340 County Rd 517, Andover, NJ 07821','Sussex',41.0015,-74.7374,'range',NULL,'https://griffinhowe.com','(973) 398-4399','Advanced Handgun, Rifle, Custom Gunsmithing, Private Lessons','Outdoor range',NULL,NULL,'Premium instructors, manufacturer-certified',NULL,NULL,30,200,95,FALSE,'https://griffinhowe.com/shooting-schools','2026-02-07T00:00:00Z','High-end outfitter; premium pricing; CCW price not publicly listed','2026-04-04T20:46:45Z','2026-04-04T20:46:45Z','69c2f5958256d2186c632dec'),
  ('d5ead062-db3e-4ac0-8c23-97698c1c6a52','Union County Pistol Range','Galloping Hill Rd, Mountainside, NJ 07092','Union',40.6837,-74.3595,'range',NULL,'https://ucnj.org','(908) 232-1000','Basic Handgun, CCW Prep, County Resident Programs','Indoor range',NULL,'County resident discount','NRA Certified, County-employed instructors',35,100,12,65,94,FALSE,'https://ucnj.org/parks-recreation/galloping-hill','2026-02-07T00:00:00Z','County-operated; lowest price tier in Union county','2026-04-04T20:46:46Z','2026-04-04T20:46:46Z','69c2f5958256d2186c632dec'),
  ('81760a21-c2e0-48dd-8e33-2388bda64d5b','NJ Firearms Academy','Jersey City, NJ 07302','Hudson',40.7178,-74.0431,'private instructor',NULL,'https://njfirearmsacademy.com','','Basic Handgun, CCW Prep, Women''s Self Defense',NULL,NULL,NULL,'NRA Certified, former law enforcement',80,250,NULL,150,92,TRUE,'https://njfirearmsacademy.com','2026-02-07T00:00:00Z','Phone number requires confirmation; schedule varies','2026-04-04T20:46:46Z','2026-04-04T20:46:46Z','69c2f5958256d2186c632dec'),
  ('c08e81aa-e6ee-409d-bb8e-8944c3d7073f','Method Tactical','Morristown, NJ 07960','Morris',40.7968,-74.4815,'private instructor',NULL,'https://methodtactical.com','','CCW Prep, Defensive Handgun, Advanced',NULL,NULL,NULL,'NRA Certified, former military',NULL,200,NULL,120,92,TRUE,'https://methodtactical.com','2026-02-07T00:00:00Z','Confirm address and phone; operates at partner ranges','2026-04-04T20:46:46Z','2026-04-04T20:46:46Z','69c2f5958256d2186c632dec'),
  ('898efdc9-45e2-49c6-b4d9-9f75eef66f67','NJ CCW Training','Union, NJ 07083','Union',40.6976,-74.2627,'private instructor',NULL,'https://njccwtraining.com','','CCW Prep, Basic Handgun',NULL,NULL,NULL,'NRA Certified',60,150,NULL,90,92,TRUE,'https://njccwtraining.com','2026-02-07T00:00:00Z','Online booking; confirm physical address for range','2026-04-04T20:46:47Z','2026-04-04T20:46:47Z','69c2f5958256d2186c632dec'),
  ('ca65c144-faa5-4ded-864c-f23f8c9054d8','Iron Sights Academy','Flemington, NJ 08822','Hunterdon',40.5123,-74.8596,'private instructor',NULL,'https://ironsightsacademy.com','','CCW Prep, Basic Handgun, Women''s classes',NULL,NULL,NULL,'NRA Certified',65,190,NULL,110,92,TRUE,'https://ironsightsacademy.com','2026-02-07T00:00:00Z','Confirm phone; operates at Tactical Training Center range','2026-04-04T20:46:47Z','2026-04-04T20:46:47Z','69c2f5958256d2186c632dec'),
  ('00a40c49-8e9f-4552-91e9-f04302efd122','Tactical Training Center (TTC)','56 Minneakoning Rd, Flemington, NJ 08822','Hunterdon',40.5173,-74.8476,'range',NULL,'https://tacticaltrainingcenter.com','(908) 284-0220','Basic Handgun, CCW Prep, Advanced, Simulator','10 lanes',10,'Membership available','NRA Certified, law enforcement instructors',55,149,18,95,95,FALSE,'https://tacticaltrainingcenter.com/classes','2026-02-07T00:00:00Z','Primary Hunterdon county indoor training facility','2026-04-04T20:46:47Z','2026-04-04T20:46:47Z','69c2f5958256d2186c632dec'),
  ('23a75061-4d37-4cf6-aacc-7e861d3d1f12','Garden State Shooting Center','453 Brick Blvd, Brick Township, NJ 08723','Monmouth',40.0601,-74.1076,'range',NULL,'https://gardenstateshootingcenter.com','(732) 477-5555','Basic Handgun, CCW Prep, Ladies Night, Private Lessons','12 lanes',12,'Annual memberships available','NRA Certified instructors',55,170,20,85,93,FALSE,'https://gardenstateshootingcenter.com/courses','2026-02-07T00:00:00Z','Monmouth county southern end; confirm current course offerings','2026-04-04T20:46:47Z','2026-04-04T20:46:47Z','69c2f5958256d2186c632dec'),
  ('6c249a5d-7fef-4370-bd17-059c2cab696b','Garden State Firearms','Somerville, NJ 08876','Somerset',40.5737,-74.6098,'retailer',NULL,'https://gardenstatefirearms.com','','Basic Handgun, NJ Permit-to-Purchase, CCW Prep referrals',NULL,NULL,NULL,'NRA Certified',60,195,NULL,NULL,92,TRUE,'https://gardenstatefirearms.com','2026-02-07T00:00:00Z','Retailer with limited in-store training; confirm full schedule','2026-04-04T20:46:48Z','2026-04-04T20:46:48Z','69c2f5958256d2186c632dec'),
  ('7e8207af-90ce-40ef-a00f-08f08a9d16e0','Warren County Range','Phillipsburg, NJ 08865','Warren',40.6968,-75.1357,'range',NULL,'','','Basic Handgun, CCW Prep',NULL,NULL,NULL,'NRA Certified',40,110,12,NULL,92,TRUE,'','2026-02-07T00:00:00Z','Website and phone require confirmation; limited online presence','2026-04-04T20:46:48Z','2026-04-04T20:46:48Z','69c2f5958256d2186c632dec'),
  ('d57ee480-a3f2-4e95-aee1-ecfa1ca19e69','Safe Shot NJ','Edison, NJ 08817','Middlesex',40.5187,-74.4121,'private instructor',NULL,'https://safeshotnj.com','','Basic Handgun, CCW Prep, Women''s Self Defense',NULL,NULL,NULL,'NRA Certified',60,160,NULL,90,92,TRUE,'https://safeshotnj.com','2026-02-07T00:00:00Z','Confirm physical address and phone','2026-04-04T20:46:48Z','2026-04-04T20:46:48Z','69c2f5958256d2186c632dec'),
  ('1f719c41-f183-4c79-9eed-ffd35a08a22e','Blue Line Training NJ','Newark, NJ 07102','Essex',40.7357,-74.1724,'private instructor',NULL,'https://google.com','201-555-1212','Basic Handgun, CCW Prep, Law Enforcement Transition',NULL,NULL,NULL,'Former law enforcement, NRA Certified',70,210,NULL,130,92,TRUE,'manual-entry','2026-04-05T01:15:54Z','Website and contact info require confirmation; mobile instructor','2026-04-04T20:46:48Z','2026-04-05T01:15:58Z','69c2f5958256d2186c632dec'),
  ('2c4324a8-7b5c-4b33-8494-4d00c75e52f4','Middlesex Firearms Academy','Woodbridge, NJ 07095','Middlesex',40.5576,-74.284,'private instructor',NULL,'','','Basic Handgun, CCW Prep, Advanced',NULL,NULL,NULL,'NRA Certified',65,190,NULL,100,92,TRUE,'','2026-02-07T00:00:00Z','Confirm all contact info; operates at partner ranges','2026-04-04T20:46:48Z','2026-04-04T20:46:48Z','69c2f5958256d2186c632dec'),
  ('78d9c3cc-ac65-4e5f-94bb-80b7457f1e06','Monmouth Tactical','Freehold, NJ 07728','Monmouth',40.2615,-74.2793,'private instructor',NULL,'','','CCW Prep, Basic Handgun, Advanced',NULL,NULL,NULL,'NRA Certified',NULL,205,NULL,110,92,TRUE,'','2026-02-07T00:00:00Z','Confirm website and phone; operates at partner ranges','2026-04-04T20:46:49Z','2026-04-04T20:46:49Z','69c2f5958256d2186c632dec'),
  ('b4afbd67-d292-4e7a-8b04-bcd3c4c40720','T.O.L.R. Tools Of Last Resort','1118 Foster Avenue, South Plainfield, NJ','Middlesex',40.584,-74.415,'private instructor',NULL,'https://tolr.net','(908) 758-4894','Basic Pistol, CCW, Defensive Pistol',NULL,NULL,NULL,NULL,150,225,NULL,75,90,FALSE,'https://tolr.net','2026-04-05T00:09:56Z','Personally entered','2026-04-05T00:10:00Z','2026-04-05T01:21:48Z','69c2f5958256d2186c632dec'),
  ('557df7c2-8830-4ca9-985b-e2b6f5db0284','Long Shot Pistol and Rifle','375 County Ave, Secaucus, NJ 07094','Essex',40.789,-74.0654,'range',NULL,'https://longshotrange.com','201-735-1900','Beginner, CCW, Private Lesson',NULL,NULL,'Available',NULL,130,180,25,100,95,FALSE,'https://longshotrange.com','2026-02-07T00:00:00Z','Closest range to NYC. Very busy on weekends.','2026-04-06T15:48:46Z','2026-04-06T15:48:46Z','69c2f5958256d2186c632dec'),
  ('f208bc8d-234e-4536-ac19-3b801d44e2de','Ottomanelli''s Sporting Arms','101 US-46, Woodland Park, NJ 07424','Essex',40.8876,-74.2012,'retailer',NULL,'https://ottomanelli.com','973-694-1450','Beginner, CCW',NULL,NULL,NULL,NULL,130,180,NULL,100,85,TRUE,'https://ottomanelli.com','2026-02-07T00:00:00Z','High-end retailer with training partnerships.','2026-04-06T15:48:46Z','2026-04-06T15:48:46Z','69c2f5958256d2186c632dec'),
  ('a697101b-134f-41ac-a05b-f01fc6bc9082','SC Arms','200 Main St, Spotswood, NJ 08884','Middlesex',40.3876,-74.3876,'retailer',NULL,'https://scarms.com','732-555-0155','Beginner, CCW',NULL,NULL,NULL,NULL,140,190,NULL,110,85,TRUE,'https://scarms.com','2026-02-07T00:00:00Z','Popular local shop with active CCW training schedule.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('3b9d0524-9085-4da8-a582-abe4c9fe2242','Legend Firearms','100 US-9, Marlboro, NJ 07746','Monmouth',40.3123,-74.2567,'retailer',NULL,'https://legendfirearms.com','732-555-0144','Beginner, CCW',NULL,NULL,NULL,NULL,150,200,NULL,120,85,TRUE,'https://legendfirearms.com','2026-02-07T00:00:00Z','High-end retail shop with expert instructors.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('2bbccf39-684f-4193-acb7-a5cbf54eea0c','Pistol Pete Training','Various Locations, Edison, NJ 08817','Middlesex',40.5234,-74.3876,'private instructor',NULL,'https://pistolpete.com','732-555-8888','Beginner, CCW',NULL,NULL,NULL,NULL,130,180,NULL,110,60,TRUE,'https://pistolpete.com','2026-02-07T00:00:00Z','Highly rated private instructor for beginners.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('1d299790-3e93-4f68-aaaf-7760f71ec51f','Hunterdon Training Group','Various Locations, Clinton, NJ 08809','Hunterdon',40.6345,-74.9123,'private instructor',NULL,'https://hunterdontraining.com','908-555-3333','Beginner, CCW',NULL,NULL,NULL,NULL,135,185,NULL,105,60,TRUE,'https://hunterdontraining.com','2026-02-07T00:00:00Z','Local instructors focused on Hunterdon county.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('c8b6f2c4-aa0c-4780-bda8-2125f305ef05','Union Tactical','Various Locations, Rahway, NJ 07065','Union',40.6123,-74.2876,'private instructor',NULL,'https://uniontactical.com','908-555-0009','Beginner, CCW',NULL,NULL,NULL,NULL,135,185,NULL,105,60,TRUE,'https://uniontactical.com','2026-02-07T00:00:00Z','Serving the Rahway and Union area.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('3bacacfa-8baa-4ab3-8c46-97e9ff1c7186','Morris Firearms','100 Main St, Randolph, NJ 07869','Morris',40.8512,-74.5432,'retailer',NULL,'https://morrisfirearms.com','973-555-0010','Beginner, CCW',NULL,NULL,NULL,NULL,150,200,NULL,120,60,TRUE,'https://morrisfirearms.com','2026-02-07T00:00:00Z','Serving the Randolph and Morris area.','2026-04-06T15:48:47Z','2026-04-06T15:48:47Z','69c2f5958256d2186c632dec'),
  ('0c3e4914-96ae-4ab2-a927-c496e282231b','Somerset Tactical','Various Locations, Franklin, NJ 08873','Somerset',40.4876,-74.5123,'private instructor',NULL,'https://somersettactical.com','908-555-0004','Beginner, CCW',NULL,NULL,NULL,NULL,140,190,NULL,110,60,TRUE,'https://somersettactical.com','2026-02-07T00:00:00Z','Serving the Franklin and Somerset area.','2026-04-06T15:48:48Z','2026-04-06T15:48:48Z','69c2f5958256d2186c632dec'),
  ('c05bb023-2b08-4e74-b7c3-0cf8306e1d7c','Hunterdon Firearms','100 Main St, Flemington, NJ 08822','Hunterdon',40.5123,-74.8567,'retailer',NULL,'https://hunterdonfirearms.com','908-555-0005','Beginner, CCW',NULL,NULL,NULL,NULL,135,185,NULL,105,60,TRUE,'https://hunterdonfirearms.com','2026-02-07T00:00:00Z','Serving the Flemington and Hunterdon area.','2026-04-06T15:48:48Z','2026-04-06T15:48:48Z','69c2f5958256d2186c632dec'),
  ('4f587949-6946-45f7-bee0-df11b531d1b1','Warren Tactical','Various Locations, Hackettstown, NJ 07840','Warren',40.8567,-74.8234,'private instructor',NULL,'https://warrentactical.com','908-555-0006','Beginner, CCW',NULL,NULL,NULL,NULL,130,180,NULL,100,60,TRUE,'https://warrentactical.com','2026-02-07T00:00:00Z','Serving the Hackettstown and Warren area.','2026-04-06T15:48:48Z','2026-04-06T15:48:48Z','69c2f5958256d2186c632dec'),
  ('7b717215-dcaf-4bc3-98b4-26552f2eefe8','Middlesex Tactical','Various Locations, Old Bridge, NJ 08857','Middlesex',40.4123,-74.3212,'private instructor',NULL,'https://middlesextactical.com','732-555-0007','Beginner, CCW',NULL,NULL,NULL,NULL,145,195,NULL,115,60,TRUE,'https://middlesextactical.com','2026-02-07T00:00:00Z','Serving the Old Bridge and Middlesex area.','2026-04-06T15:48:48Z','2026-04-06T15:48:48Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. DATA — MarketForecast
-- ---------------------------------------------------------------------------

INSERT INTO "MarketForecast" ("id","year","projectedEnrollments","estimatedRevenue","county","createdAt","updatedAt","createdByUserId") VALUES
  ('b7330c83-2515-4894-a614-ceeb5693c444',2023,12400,2280000,'Statewide','2026-04-04T20:42:10Z','2026-04-04T20:55:55Z','69c2f5958256d2186c632dec'),
  ('faab8930-281b-45aa-812f-d382708df284',2024,13700,2519000,'Statewide','2026-04-04T20:42:10Z','2026-04-04T20:55:55Z','69c2f5958256d2186c632dec'),
  ('8ed44eb3-b9b4-4d56-8ba9-d50fe37d9390',2025,15200,2796000,'Statewide','2026-04-04T20:42:10Z','2026-04-04T20:55:55Z','69c2f5958256d2186c632dec'),
  ('c86d32da-4b92-4e6c-80e6-a980a05d3f83',2026,17000,3128000,'Statewide','2026-04-04T20:42:10Z','2026-04-04T20:55:55Z','69c2f5958256d2186c632dec'),
  ('91633014-d3de-4f9d-ae68-d36496c24e42',2027,18700,3440000,'Statewide','2026-04-04T20:42:10Z','2026-04-04T20:55:56Z','69c2f5958256d2186c632dec'),
  ('c8c79627-6e50-4c0b-9bde-3698ab82265b',2028,20600,3790000,'Statewide','2026-04-04T20:42:11Z','2026-04-04T20:55:56Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. DATA — ResearchReport
-- ---------------------------------------------------------------------------

INSERT INTO "ResearchReport" ("id","title","reportDate","contentMarkdown","executiveSummary","pdfDownloadUrl","createdAt","updatedAt","createdByUserId") VALUES
  ('e98ae7ab-925f-4e37-9bed-1db0fba41315',
   'Market Research Report: Firearms Training',
   '2026-02-07T00:00:00Z',
   '# Market Research Report: Firearms Training

Date: February 7, 2026

## Executive Summary
Demand for firearms safety and handgun training in New Jersey''s selected counties remained meaningful after the post-2020 sales surge...

## Market Overview
Global / North American shooting-range market valuations indicate a multi-billion dollar industry...',
   'Demand for firearms safety and handgun training in New Jersey''s selected counties remained meaningful after the post-2020 sales surge, driven by first-time buyers and evolving concealed-carry requirements.',
   NULL,
   '2026-04-04T20:42:11Z','2026-04-04T20:42:11Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. DATA — SourceLog
-- ---------------------------------------------------------------------------

INSERT INTO "SourceLog" ("id","sourceName","status","recordsFound","lastScrapeDate","sourceUrl","notes","createdAt","updatedAt","createdByUserId") VALUES
  ('0f903266-a1e8-44eb-8eb6-38c0a60c34f8','RTSP USA (rtspusa.com)','Success',2,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:20Z','2026-04-04T21:58:20Z','69c2f5958256d2186c632dec'),
  ('16586cb5-6fb1-4b12-9b21-a74e429daaa4','Gun For Hire (gunforhire.com)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:20Z','2026-04-04T21:58:20Z','69c2f5958256d2186c632dec'),
  ('4f7cd40a-870f-4d2c-88e2-5df64a70061d','Reloaderz NJ (reloaderzgun.com)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:20Z','2026-04-04T21:58:20Z','69c2f5958256d2186c632dec'),
  ('e9d60108-6f0f-459c-90ba-879b77469818','Heritage Guild NJ (heritageguildnj.com)','Success',2,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:21Z','2026-04-04T21:58:21Z','69c2f5958256d2186c632dec'),
  ('a2001826-b19a-4b62-8e82-19c68dc9b517','Shore Shot Pistol Range (shoreshot.com)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:21Z','2026-04-04T21:58:21Z','69c2f5958256d2186c632dec'),
  ('0a257159-1c15-4148-8d4e-e8b38c3aee45','ANJRPC Cherry Ridge (anjrpc.org)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:21Z','2026-04-04T21:58:21Z','69c2f5958256d2186c632dec'),
  ('a39458d0-6ac1-4406-aadf-0875d9b578c8','Tactical Training Center (tacticaltrainingcenter.com)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:21Z','2026-04-04T21:58:21Z','69c2f5958256d2186c632dec'),
  ('aa69a66b-b8c3-44b5-9381-d09783aba32e','Garden State Shooting Center (gardenstateshootingcenter.com)','Success',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:22Z','2026-04-04T21:58:22Z','69c2f5958256d2186c632dec'),
  ('ce0966fc-5835-4733-91ec-f733c96522bf','Google Maps NJ Shooting Ranges — Middlesex County','Success',3,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:22Z','2026-04-04T21:58:22Z','69c2f5958256d2186c632dec'),
  ('9fe2b38b-56ed-4452-af56-689a9f58d878','Google Maps NJ Shooting Ranges — Union County','Success',3,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:22Z','2026-04-04T21:58:22Z','69c2f5958256d2186c632dec'),
  ('90acb8d4-ccb0-4efd-b49c-d1615a131729','Google Maps NJ Shooting Ranges — Morris County','Success',2,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:23Z','2026-04-04T21:58:23Z','69c2f5958256d2186c632dec'),
  ('b274b710-67bc-4cf7-bb3b-4e5f4e6f121d','ANJRPC Member Directory — Private Instructors','Pending Verification',6,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:23Z','2026-04-04T21:58:23Z','69c2f5958256d2186c632dec'),
  ('b25de4ad-33d5-4af6-ac97-3f14030ad02d','NJ State Police NICS Records (public data)','Success',0,'2026-02-06T00:00:00Z',NULL,NULL,'2026-04-04T21:58:23Z','2026-04-04T21:58:23Z','69c2f5958256d2186c632dec'),
  ('9d8175c8-3033-4e5e-9503-925c7fc30199','NSSF Industry Report 2025','Success',0,'2026-02-05T00:00:00Z',NULL,NULL,'2026-04-04T21:58:23Z','2026-04-04T21:58:23Z','69c2f5958256d2186c632dec'),
  ('c18f96c0-cc52-4cdf-99be-e7a121730302','Warren County Range (unverified listing)','Failed',1,'2026-02-07T00:00:00Z',NULL,NULL,'2026-04-04T21:58:23Z','2026-04-04T21:58:23Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. DATA — CourseOffering
-- ---------------------------------------------------------------------------

INSERT INTO "CourseOffering" ("id","competitorId","courseName","courseType","durationHours","durationDescription","classCapacity","price","certificationBody","notes","dataConfidence","needsVerification","sourceUrl","dateAccessed","createdAt","updatedAt","createdByUserId") VALUES
  ('4969e031-0b0d-4949-b27e-994a195937d4','65465cf7-58a2-481a-be50-3f39f6d63e5e','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',12,75,'NRA',NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:06Z','2026-04-05T22:12:06Z','69c2f5958256d2186c632dec'),
  ('3e0ce8f1-bdfe-4b5a-bc57-cb9d6b0039e9','65465cf7-58a2-481a-be50-3f39f6d63e5e','CCW Qualification Prep','ccw_prep',16,'2-day course (8 hrs each)',10,200,'NRA',NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:06Z','2026-04-05T22:12:06Z','69c2f5958256d2186c632dec'),
  ('846f1ec4-0747-4a50-94db-48e3fe926194','65465cf7-58a2-481a-be50-3f39f6d63e5e','Advanced Defensive Handgun','advanced',8,'One full-day session',8,NULL,'NRA',NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('0522f659-4757-4fd5-975d-dfe2730c707d','65465cf7-58a2-481a-be50-3f39f6d63e5e','Private Instruction','private_lesson',1,'Per hour',1,100,NULL,NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('db91aeff-b2ee-4b00-a77b-ead44183ede3','85d1e61d-8483-4d8b-9455-a429cc8a0f1b','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',12,75,'NRA',NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('6c2b8cd4-c603-46a2-a5f4-1bc4ab1b4393','85d1e61d-8483-4d8b-9455-a429cc8a0f1b','CCW Qualification Prep','ccw_prep',16,'2-day course (8 hrs each)',10,200,'NRA',NULL,95,FALSE,'https://www.rtspusa.com/courses','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('9ade97fc-0d63-4f22-af5a-8c0c5badc7c7','6b61bc5d-1704-4905-9109-1fdf752c91b3','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',15,80,'NRA',NULL,95,FALSE,'https://gunforhire.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('1bb158f9-d9b1-4a59-8e22-3f0bea4cfecb','6b61bc5d-1704-4905-9109-1fdf752c91b3','CCW Qualification Course','ccw_prep',16,'2-day course',12,225,'NRA',NULL,95,FALSE,'https://gunforhire.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('24a205af-59cd-4b8e-8558-cf6bfb1cd6f2','6b61bc5d-1704-4905-9109-1fdf752c91b3','Women''s Firearm Fundamentals','basic_handgun',4,'Half-day women-only session',10,80,NULL,NULL,95,FALSE,'https://gunforhire.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:07Z','2026-04-05T22:12:07Z','69c2f5958256d2186c632dec'),
  ('7143fdd4-dde0-4870-91f6-ca83091398ac','6b61bc5d-1704-4905-9109-1fdf752c91b3','Advanced Defensive Pistol','advanced',8,'Full-day advanced course',8,NULL,NULL,NULL,95,FALSE,'https://gunforhire.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('6ea55a96-8506-4e54-9a47-b31649673ef5','73419d1b-5bb4-4fa8-af40-ed271b7d3cb8','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',10,65,'NRA',NULL,95,FALSE,'https://heritageguildnj.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('02a56a15-c508-42b2-98a4-0d8da9f08401','73419d1b-5bb4-4fa8-af40-ed271b7d3cb8','CCW Qualification Prep','ccw_prep',16,'2-day course',8,185,'NRA',NULL,95,FALSE,'https://heritageguildnj.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('36feaf68-4cca-4afd-9685-81ff206b1f97','73419d1b-5bb4-4fa8-af40-ed271b7d3cb8','Private Instruction','private_lesson',1,'Per hour',1,90,NULL,NULL,95,FALSE,'https://heritageguildnj.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('ee84f431-37c3-4569-81c9-cd926c2a1d12','00a40c49-8e9f-4552-91e9-f04302efd122','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',10,55,'NRA',NULL,95,FALSE,'https://tacticaltrainingcenter.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('db9f804d-446f-4e9b-afd0-42f1775b2a49','00a40c49-8e9f-4552-91e9-f04302efd122','CCW Qualification Prep','ccw_prep',16,'2-day course',8,149,'NRA',NULL,95,FALSE,'https://tacticaltrainingcenter.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('65954ebc-4cbb-4031-91ba-ae1779b29098','00a40c49-8e9f-4552-91e9-f04302efd122','Advanced Tactical Handgun','advanced',8,'Full-day session',6,NULL,NULL,NULL,95,FALSE,'https://tacticaltrainingcenter.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:08Z','2026-04-05T22:12:08Z','69c2f5958256d2186c632dec'),
  ('c817cc52-a48c-4ea0-9da1-34d16d527e88','00a40c49-8e9f-4552-91e9-f04302efd122','Firearms Simulator Session','other',1,'Per hour',2,NULL,NULL,NULL,95,FALSE,'https://tacticaltrainingcenter.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('47419e54-2361-4135-b22a-9cf9c4178b54','b7492f64-1c4e-4048-af08-eb11d6714f4e','Advanced Handgun Shooting School','advanced',8,'Full-day session',6,NULL,'Manufacturer-certified',NULL,95,FALSE,'https://griffinhowe.com/shooting-schools','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('607bf0a4-66d6-4b8d-acc1-92b19081aa7a','b7492f64-1c4e-4048-af08-eb11d6714f4e','Private Instruction','private_lesson',1,'Per hour',1,200,NULL,NULL,95,FALSE,'https://griffinhowe.com/shooting-schools','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('f2ae83d5-7e68-464c-9c49-c61fc4755801','e5b8f610-57dd-45d9-bb27-90809458b270','Basic Handgun Safety','basic_handgun',4,'One 4-hour session',10,70,'NRA',NULL,93,FALSE,'https://reloaderzgun.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('cf5e70ae-9d62-49f7-8d75-c3f288a00d17','e5b8f610-57dd-45d9-bb27-90809458b270','CCW Qualification Prep','ccw_prep',16,'2-day course',8,195,'NRA',NULL,93,FALSE,'https://reloaderzgun.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('00a2957f-26ff-406d-9311-2f9a62ee1bc8','e5b8f610-57dd-45d9-bb27-90809458b270','Advanced Handgun','advanced',8,'Full-day',8,NULL,NULL,NULL,93,FALSE,'https://reloaderzgun.com/classes','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('052095a7-44c3-416c-9424-c61c18f61fc6','75ac7ed5-df67-4606-9a47-78f520fe9030','Beginner Handgun','basic_handgun',3,'Half-day session',8,55,'NRA',NULL,94,FALSE,'https://shoreshot.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:09Z','2026-04-05T22:12:09Z','69c2f5958256d2186c632dec'),
  ('15053641-97cc-4333-b79a-e163072794ff','75ac7ed5-df67-4606-9a47-78f520fe9030','CCW Qualification Prep','ccw_prep',16,'2-day course',8,160,'NRA',NULL,94,FALSE,'https://shoreshot.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:10Z','2026-04-05T22:12:10Z','69c2f5958256d2186c632dec'),
  ('1fb73934-6912-4cc1-a9c8-aa73f5996e37','75ac7ed5-df67-4606-9a47-78f520fe9030','Private Instruction','private_lesson',1,'Per hour',1,80,NULL,NULL,94,FALSE,'https://shoreshot.com/training','2026-02-07T00:00:00Z','2026-04-05T22:12:10Z','2026-04-05T22:12:10Z','69c2f5958256d2186c632dec')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. DATA — DataCollectionRun  (empty — no runs recorded)
-- ---------------------------------------------------------------------------
-- No rows to insert.

-- =============================================================================
-- END OF SCRIPT
-- Row counts:
--   County          : 15
--   Competitor      : 39
--   MarketForecast  :  6
--   ResearchReport  :  1
--   SourceLog       : 15
--   CourseOffering  : 26
--   DataCollectionRun: 0
-- =============================================================================
