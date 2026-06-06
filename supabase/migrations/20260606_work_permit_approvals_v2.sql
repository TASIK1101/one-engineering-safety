-- ============================================================
-- 작업허가서 역할별 전자승인 시스템 v2 (보완본)
-- ⚠️ 기존 work_permit_approvals / work_permits 데이터 유지 (삭제 없음)
-- ⚠️ idempotent — 재실행 안전
-- ⚠️ approval_token 없는 row에만 token 생성
-- ⚠️ approver_employee_id가 null인 기존 미완료 row는 null 유지
--    (관리자가 상세 화면에서 직접 담당자 지정)
-- ============================================================

-- 1. work_permit_approvals 컬럼 추가
alter table work_permit_approvals
  add column if not exists approver_employee_id uuid references employees(id),
  add column if not exists approval_token uuid unique default gen_random_uuid(),
  add column if not exists rejection_reason text,
  add column if not exists signed_ip text,
  add column if not exists signed_user_agent text;

-- 2. 기존 row approval_token 백필 (null인 것만 — 기존 token 보존)
update work_permit_approvals
  set approval_token = gen_random_uuid()
  where approval_token is null;

-- 3. unique(permit_id, approver_role) 제약 추가
--    기존 데이터에 동일 (permit_id, approver_role) 중복이 있으면
--    제약 추가가 실패하므로, 중복이 없을 때만 추가한다.
--    (데이터는 절대 삭제하지 않는다. 중복 발견 시 NOTICE로 안내)
do $$
declare
  dup_count int;
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'work_permit_approvals_permit_role_unique'
  ) then
    raise notice 'unique 제약이 이미 존재합니다. 건너뜁니다.';
    return;
  end if;

  select count(*) into dup_count from (
    select permit_id, approver_role
    from work_permit_approvals
    group by permit_id, approver_role
    having count(*) > 1
  ) d;

  if dup_count > 0 then
    raise notice '동일 (permit_id, approver_role) 중복 row가 % 건 있어 unique 제약을 추가하지 않았습니다. 중복을 수동 확인 후 정리하세요. (데이터는 삭제하지 않음)', dup_count;
  else
    alter table work_permit_approvals
      add constraint work_permit_approvals_permit_role_unique
      unique (permit_id, approver_role);
    raise notice 'unique 제약을 추가했습니다.';
  end if;
end $$;

-- 4. work_permits 컬럼 추가 (역할별 담당자 employee_id 저장용)
alter table work_permits
  add column if not exists author_employee_id uuid references employees(id),
  add column if not exists safety_manager_employee_id uuid references employees(id),
  add column if not exists representative_employee_id uuid references employees(id),
  add column if not exists locked_at timestamptz;

-- 5. work_permit_approvals RLS 활성화 및 정책 추가
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

-- 6. 인덱스 추가
create index if not exists idx_work_permit_approvals_permit on work_permit_approvals(permit_id);
create index if not exists idx_work_permit_approvals_token  on work_permit_approvals(approval_token);
