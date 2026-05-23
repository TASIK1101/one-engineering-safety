-- tbm_records 에 sign_token 컬럼 추가
-- (근로자 공개 서명 링크 토큰)
ALTER TABLE tbm_records
  ADD COLUMN IF NOT EXISTS sign_token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL;

-- 기존 rows에 token이 없을 경우 채우기
UPDATE tbm_records
  SET sign_token = gen_random_uuid()
  WHERE sign_token IS NULL;

-- sign_token 인덱스 (서명 링크 조회 성능)
CREATE INDEX IF NOT EXISTS tbm_records_sign_token_idx
  ON tbm_records (sign_token);

-- Public SELECT 정책: sign_token으로 TBM 레코드 조회 허용 (이미 있을 수 있음)
-- 이미 "Public can read tbm_records" 정책이 있으면 아래는 무시됨
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tbm_records'
      AND policyname = 'Public can read tbm_records for sign page'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can read tbm_records for sign page"
        ON tbm_records FOR SELECT
        USING (true)
    ';
  END IF;
END$$;

-- Public SELECT 정책: tbm_attendees 조회 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tbm_attendees'
      AND policyname = 'Public can read tbm_attendees for sign page'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can read tbm_attendees for sign page"
        ON tbm_attendees FOR SELECT
        USING (true)
    ';
  END IF;
END$$;
