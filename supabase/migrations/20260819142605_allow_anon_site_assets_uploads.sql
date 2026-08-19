-- Allow anon uploads to the site-assets bucket (no-login app)
DROP POLICY IF EXISTS "anon_insert_site_assets" ON storage.objects;
CREATE POLICY "anon_insert_site_assets"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "anon_update_site_assets" ON storage.objects;
CREATE POLICY "anon_update_site_assets"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "anon_delete_site_assets" ON storage.objects;
CREATE POLICY "anon_delete_site_assets"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'site-assets');
