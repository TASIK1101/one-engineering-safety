-- ============================================================
-- TBM / 위험성평가 일일교육 모듈 마이그레이션
-- Supabase SQL Editor에서 직접 실행하세요.
-- ============================================================

-- Worksites
create table if not exists worksites (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  site_name text not null,
  project_name text,
  location text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table worksites enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='worksites' and policyname='worksites_admin_all') then
    create policy "worksites_admin_all" on worksites for all using (auth.uid() = admin_id);
  end if;
end $$;

-- TBM Templates
create table if not exists tbm_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  template_name text not null,
  work_type text not null,
  process_name text,
  default_hazard_items jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);
alter table tbm_templates enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tbm_templates' and policyname='tbm_templates_admin_all') then
    create policy "tbm_templates_admin_all" on tbm_templates for all using (auth.uid() = admin_id);
  end if;
end $$;

-- TBM Records
create table if not exists tbm_records (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  date date not null,
  month text generated always as (to_char(date, 'YYYY-MM')) stored,
  company text,
  worksite_id uuid references worksites,
  worksite_location text,
  work_type text not null,
  process_name text,
  supervisor text,
  safety_manager text,
  site_manager text,
  hazard_items jsonb default '[]'::jsonb,
  main_hazard_notes text,
  accident_case_notes text,
  education_done boolean default false,
  status text default '작성중' check (status in ('작성중','서명중','검토중','완료','반려')),
  created_by uuid references auth.users,
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tbm_records enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tbm_records' and policyname='tbm_records_admin_all') then
    create policy "tbm_records_admin_all" on tbm_records for all using (auth.uid() = admin_id);
  end if;
end $$;

-- TBM Attendees
create table if not exists tbm_attendees (
  id uuid primary key default gen_random_uuid(),
  tbm_record_id uuid references tbm_records on delete cascade not null,
  employee_id uuid references employees,
  employee_name text not null,
  attendance_status text default '대기' check (attendance_status in ('대기','서명완료','불참')),
  signature_data text,
  signed_at timestamptz,
  created_at timestamptz default now()
);
alter table tbm_attendees enable row level security;
-- Admin: full access via tbm_records
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tbm_attendees' and policyname='tbm_attendees_admin_all') then
    create policy "tbm_attendees_admin_all" on tbm_attendees for all using (
      exists (select 1 from tbm_records r where r.id = tbm_record_id and r.admin_id = auth.uid())
    );
  end if;
end $$;
-- Public: can read attendees (for sign page)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tbm_attendees' and policyname='tbm_attendees_public_read') then
    create policy "tbm_attendees_public_read" on tbm_attendees for select using (true);
  end if;
end $$;
-- Public: can read tbm_records (for sign page header info)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tbm_records' and policyname='tbm_records_public_read') then
    create policy "tbm_records_public_read" on tbm_records for select using (true);
  end if;
end $$;
