-- training_assignments 테이블에 이수 기록 강화 컬럼 추가
alter table public.training_assignments
  add column if not exists started_at    timestamptz,
  add column if not exists duration_seconds integer,
  add column if not exists consent_checked  boolean not null default false;
