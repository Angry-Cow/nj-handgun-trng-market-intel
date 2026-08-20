/*
# Make IndustryIndicator.sourceUrl NOT NULL

1. Changes
   - Alter "IndustryIndicator" column "sourceUrl" from nullable to NOT NULL.
   - This enforces at the database level that every indicator must have a source link.

2. Safety
   - The existing row already has a non-null sourceUrl, so the ALTER succeeds.
   - No data is lost or transformed.
*/

ALTER TABLE "IndustryIndicator" ALTER COLUMN "sourceUrl" SET NOT NULL;
