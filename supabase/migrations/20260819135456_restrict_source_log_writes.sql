-- F11: SourceLog is an append-only audit trail. Remove edit/delete access.
DROP POLICY IF EXISTS "anon_update_sourcelog" ON "SourceLog";
DROP POLICY IF EXISTS "anon_delete_sourcelog" ON "SourceLog";

REVOKE UPDATE, DELETE ON "SourceLog" FROM anon, authenticated;
