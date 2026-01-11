-- Update storage bucket names and policies
-- resource -> resources, asset -> assets

-- Drop old policies
DROP POLICY IF EXISTS "Users can upload to own folder in resource" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files in resource" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in resource" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files in asset" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to asset" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage asset" ON storage.objects;

-- Delete old buckets (only if empty, otherwise manual cleanup needed)
DELETE FROM storage.buckets WHERE id = 'resource';
DELETE FROM storage.buckets WHERE id = 'asset';

-- Create new buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resources bucket
-- Path: images/{uuid}.{ext}
CREATE POLICY "Authenticated users can upload to resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resources' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resources' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete resources"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resources' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for assets bucket
-- Path: images/{uuid}.{ext} or videos/{uuid}.{ext}
CREATE POLICY "Authenticated users can view assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assets' AND
    auth.role() = 'authenticated'
  );

-- Service role can manage assets bucket (for Edge Functions)
CREATE POLICY "Service role can manage assets"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'assets' AND
    auth.jwt() ->> 'role' = 'service_role'
  );
