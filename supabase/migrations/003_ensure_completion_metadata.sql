-- 이수 기록 증빙 메타데이터 컬럼 확인 및 보강
-- (002_add_training_fields.sql 에서 이미 추가됐다면 if not exists 로 안전하게 실행됩니다)
alter table public.training_assignments
  add column if not exists started_at      timestamptz,
  add column if not exists duration_seconds integer,
  add column if not exists consent_checked  boolean not null default false;
