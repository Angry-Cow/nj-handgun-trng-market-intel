-- Create a public bucket for site assets (icons, logos, images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (anon + authenticated) to read from the bucket
CREATE POLICY "public_read_site_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-assets');

-- Allow authenticated users to upload (for when a login is added later)
CREATE POLICY "auth_insert_site_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- Allow authenticated users to update/replace their uploads
CREATE POLICY "auth_update_site_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

-- Allow authenticated users to delete
CREATE POLICY "auth_delete_site_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');
