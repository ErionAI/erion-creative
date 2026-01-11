-- Create storage buckets

-- Resource bucket (사용자 업로드 이미지)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource', 'resource', false)
ON CONFLICT (id) DO NOTHING;

-- Asset bucket (생성된 결과물)
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset', 'asset', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resource bucket
CREATE POLICY "Users can upload to own folder in resource"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resource' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files in resource"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resource' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files in resource"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resource' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for asset bucket
CREATE POLICY "Users can view own files in asset"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'asset' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Service role can upload to asset bucket
CREATE POLICY "Service role can upload to asset"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'asset' AND
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role can manage asset"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'asset' AND
    auth.jwt() ->> 'role' = 'service_role'
  );
