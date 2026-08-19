-- F10: ResearchReport is only created and read by the app. Remove edit/delete access.
DROP POLICY IF EXISTS "anon_update_report" ON "ResearchReport";
DROP POLICY IF EXISTS "anon_delete_report" ON "ResearchReport";

REVOKE UPDATE, DELETE ON "ResearchReport" FROM anon, authenticated;
