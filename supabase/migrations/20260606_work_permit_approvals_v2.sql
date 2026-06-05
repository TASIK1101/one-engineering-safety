-- ============================================================
-- 작업허가서 역할별 전자승인 시스템 v2
-- ⚠️ 기존 work_permit_approvals / work_permits 데이터 유지
-- ⚠️ idempotent — 재실행 안전
-- ============================================================

-- 1. work_permit_approvals 컬럼 추가
alter table work_permit_approvals
  add column if not exists approver_employee_id uuid references employees(id),
  add column if not exists approval_token uuid unique default gen_random_uuid(),
  add column if not exists rejection_reason text,
  add column if not exists signed_ip text,
  add column if not exists signed_user_agent text;

-- 기존 row approval_token 백필 (null인 것만)
update work_permit_approvals
  set approval_token = gen_random_uuid()
  where approval_token is null;

-- unique(permit_id, approver_role) 제약 추가 (없는 경우만)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'work_permit_approvals_permit_role_unique'
  ) then
    alter table work_permit_approvals
      add constraint work_permit_approvals_permit_role_unique
      unique (permit_id, approver_role);
  end if;
end $$;

-- 2. work_permits 컬럼 추가 (역할별 담당자 employee_id 저장용)
alter table work_permits
  add column if not exists author_employee_id uuid references employees(id),
  add column if not exists safety_manager_employee_id uuid references employees(id),
  add column if not exists representative_employee_id uuid references employees(id),
  add column if not exists locked_at timestamptz;

-- 3. work_permit_approvals RLS 활성화 및 정책 추가
alter table work_permit_approvals enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'work_permit_approvals'
      and policyname = 'work_permit_approvals_admin_all'
  ) then
    create policy "work_permit_approvals_admin_all" on work_permit_approvals
      for all
      using (
        exists (
          select 1 from work_permits p
          where p.id = permit_id and p.admin_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from work_permits p
          where p.id = permit_id and p.admin_id = auth.uid()
        )
      );
  end if;
end $$;

-- 4. 인덱스 추가
create index if not exists idx_work_permit_approvals_permit on work_permit_approvals(permit_id);
create index if not exists idx_work_permit_approvals_token  on work_permit_approvals(approval_token);
