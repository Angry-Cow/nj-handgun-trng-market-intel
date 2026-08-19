-- F8: CourseOffering is read-only in the application. Remove anonymous write access.
DROP POLICY IF EXISTS "anon_insert_course" ON "CourseOffering";
DROP POLICY IF EXISTS "anon_update_course" ON "CourseOffering";
DROP POLICY IF EXISTS "anon_delete_course" ON "CourseOffering";

REVOKE INSERT, UPDATE, DELETE ON "CourseOffering" FROM anon, authenticated;
