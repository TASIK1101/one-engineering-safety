-- ============================================================
-- 005_safe_schema_update.sql
-- 누락 가능한 모든 컬럼을 안전하게 추가합니다.
-- add column if not exists 사용으로 이미 있는 컬럼은 무시합니다.
-- Supabase SQL Editor에서 그대로 실행 가능합니다.
-- ============================================================

-- ── trainings 테이블 ─────────────────────────────────────────
-- 교육 유형 (정기/작업전/신규자/특별/안전공지)
alter table public.trainings
  add column if not exists training_type text not null default 'regular_training';

-- training_type 허용값 제약 (이미 있으면 drop 후 재생성)
alter table public.trainings
  drop constraint if exists trainings_training_type_check;

alter table public.trainings
  add constraint trainings_training_type_check
    check (training_type in (
      'regular_training',
      'pre_work_training',
      'new_employee_training',
      'special_training',
      'safety_notice'
    ));

-- ── training_assignments 테이블 ──────────────────────────────
-- 교육 시작 시각
alter table public.training_assignments
  add column if not exists started_at timestamptz;

-- 제출 완료 시각 (001_init.sql 의 completed_at 과 같은 역할이지만 명시적으로 추가)
-- 이미 있으면 무시됨
alter table public.training_assignments
  add column if not exists completed_at timestamptz;

-- 소요 시간 (초)
alter table public.training_assignments
  add column if not exists duration_seconds integer;

-- 동의 체크 여부
alter table public.training_assignments
  add column if not exists consent_checked boolean not null default false;
