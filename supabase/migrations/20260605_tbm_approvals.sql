-- ============================================================
-- TBM 역할별 전자확인(승인) 모듈
-- 참고: TBM은 매일 사용하는 문서이므로 과도한 결재 강제 없이
--       역할별 전자확인을 "선택적"으로 지원한다.
--
-- ⚠️ 기존 TBM 참석자 서명 기능(tbm_attendees)에는 영향이 없다.
-- ⚠️ 기존 데이터 삭제/초기화 없음 — 컬럼/테이블 추가만 수행한다.
-- ⚠️ 모두 idempotent (재실행 안전).
-- ============================================================

-- 1. tbm_records 컬럼 추가 (역할 분리 유지 — 작성자/안전전담자/대표를 합치지 않음)
alter table tbm_records add column if not exists author_employee_id uuid references employees(id);
alter table tbm_records add column if not exists safety_manager_employee_id uuid references employees(id);
alter table tbm_records add column if not exists representative_employee_id uuid references employees(id);
alter table tbm_records add column if not exists author_is_safety_manager boolean default true;
alter table tbm_records add column if not exists require_representative_approval boolean default false;
alter table tbm_records add column if not exists locked_at timestamptz;

-- 2. tbm_approvals 테이블 (역할별 전자확인 1건씩)
create table if not exists tbm_approvals (
  id uuid primary key default gen_random_uuid(),
  tbm_record_id uuid references tbm_records(id) on delete cascade not null,
  approver_role text not null check (approver_role in ('안전전담자','소장대표')),
  approver_employee_id uuid references employees(id),
  approver_name text,
  approval_status text default '대기' check (approval_status in ('대기','승인','반려')),
  signature_data text,
  rejection_reason text,
  approved_at timestamptz,
  approval_token uuid unique default gen_random_uuid(),
  -- 감사 로그
  signed_ip text,
  signed_user_agent text,
  created_at timestamptz default now(),
  -- 동일 TBM 동일 역할 중복 방지
  unique (tbm_record_id, approver_role)
);

alter table tbm_approvals enable row level security;

-- 관리자: 부모 TBM 소유자(admin_id = auth.uid())만 전체 접근
-- 공개 승인 페이지는 서버 API route에서 service role 클라이언트로만 접근하므로
-- 공개(anon) read 정책을 두지 않는다 (서명 데이터 보호).
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tbm_approvals' and policyname = 'tbm_approvals_admin_all'
  ) then
    create policy "tbm_approvals_admin_all" on tbm_approvals for all using (
      exists (select 1 from tbm_records r where r.id = tbm_record_id and r.admin_id = auth.uid())
    ) with check (
      exists (select 1 from tbm_records r where r.id = tbm_record_id and r.admin_id = auth.uid())
    );
  end if;
end $$;

create index if not exists idx_tbm_approvals_record on tbm_approvals(tbm_record_id);
create index if not exists idx_tbm_approvals_token on tbm_approvals(approval_token);
