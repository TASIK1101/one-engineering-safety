-- ============================================================
-- 안전점검 + 시정조치 모듈 마이그레이션
-- Supabase SQL Editor에서 직접 실행하세요.
-- ============================================================

-- safety_inspections
create table if not exists safety_inspections (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  inspection_date date not null,
  inspector_name text not null,
  inspection_area text not null,
  worksite_id uuid references worksites,
  status text default '작성중' check (status in ('작성중', '완료')),
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table safety_inspections enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='safety_inspections' and policyname='safety_inspections_admin_all') then
    create policy "safety_inspections_admin_all" on safety_inspections for all using (auth.uid() = admin_id);
  end if;
end $$;

-- safety_inspection_items
create table if not exists safety_inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid references safety_inspections on delete cascade not null,
  category text not null,
  item_text text not null,
  location text,
  condition_status text default '양호' check (condition_status in ('양호', '보통', '불량')),
  issue_description text,
  action_note text,
  before_photo_url text,
  after_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table safety_inspection_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='safety_inspection_items' and policyname='safety_inspection_items_admin_all') then
    create policy "safety_inspection_items_admin_all" on safety_inspection_items for all using (
      exists (select 1 from safety_inspections s where s.id = inspection_id and s.admin_id = auth.uid())
    );
  end if;
end $$;

-- corrective_actions
create table if not exists corrective_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  inspection_id uuid references safety_inspections on delete cascade,
  inspection_item_id uuid references safety_inspection_items on delete set null,
  issue_title text not null,
  issue_description text,
  assigned_to text,
  due_date date,
  before_photo_url text,
  after_photo_url text,
  action_result text,
  status text default '대기' check (status in ('대기', '조치중', '검토중', '완료', '반려')),
  rejection_reason text,
  completed_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table corrective_actions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='corrective_actions' and policyname='corrective_actions_admin_all') then
    create policy "corrective_actions_admin_all" on corrective_actions for all using (auth.uid() = admin_id);
  end if;
end $$;
