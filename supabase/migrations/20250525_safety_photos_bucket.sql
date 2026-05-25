-- ============================================================
-- safety-photos 버킷 생성 및 Storage RLS 정책 설정
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- ============================================================

-- 1. 버킷 생성 (public = true → 이미지 URL 직접 접근 가능)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'safety-photos',
  'safety-photos',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 인증된 사용자(관리자)만 업로드 허용
DROP POLICY IF EXISTS "authenticated_upload_safety_photos" ON storage.objects;
CREATE POLICY "authenticated_upload_safety_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'safety-photos');

-- 3. 누구나 읽기 가능 (public 버킷 + 인쇄/기록 페이지 접근용)
DROP POLICY IF EXISTS "public_read_safety_photos" ON storage.objects;
CREATE POLICY "public_read_safety_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'safety-photos');

-- 4. 인증된 사용자 업데이트(덮어쓰기) 허용
DROP POLICY IF EXISTS "authenticated_update_safety_photos" ON storage.objects;
CREATE POLICY "authenticated_update_safety_photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'safety-photos');

-- 5. 인증된 사용자 삭제 허용
DROP POLICY IF EXISTS "authenticated_delete_safety_photos" ON storage.objects;
CREATE POLICY "authenticated_delete_safety_photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'safety-photos');
