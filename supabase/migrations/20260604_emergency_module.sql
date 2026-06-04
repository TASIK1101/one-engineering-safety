-- ============================================================
-- 비상조치 및 위기대응 관리 모듈 마이그레이션
-- ============================================================

-- 1. emergency_contacts
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  contact_type text not null,
  organization_name text not null,
  contact_name text,
  phone text not null,
  secondary_phone text,
  description text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table emergency_contacts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emergency_contacts' and policyname='emergency_contacts_admin_all') then
    create policy "emergency_contacts_admin_all" on emergency_contacts for all
      using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_emergency_contacts_admin on emergency_contacts(admin_id);

-- 2. emergency_equipment
create table if not exists emergency_equipment (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  equipment_name text not null,
  category text not null,
  location text not null,
  quantity integer default 1,
  status text default '정상' check (status in ('정상','점검필요','사용불가','교체예정')),
  last_inspected_at date,
  next_inspection_date date,
  inspector_name text,
  note text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table emergency_equipment enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emergency_equipment' and policyname='emergency_equipment_admin_all') then
    create policy "emergency_equipment_admin_all" on emergency_equipment for all
      using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_emergency_equipment_admin on emergency_equipment(admin_id);

-- 3. emergency_scenarios
create table if not exists emergency_scenarios (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  scenario_type text not null,
  title text not null,
  overview text,
  initial_response jsonb default '[]'::jsonb,
  evacuation_actions jsonb default '[]'::jsonb,
  rescue_actions jsonb default '[]'::jsonb,
  hazard_removal_actions jsonb default '[]'::jsonb,
  secondary_damage_prevention jsonb default '[]'::jsonb,
  reporting_actions jsonb default '[]'::jsonb,
  role_assignments jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table emergency_scenarios enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emergency_scenarios' and policyname='emergency_scenarios_admin_all') then
    create policy "emergency_scenarios_admin_all" on emergency_scenarios for all
      using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_emergency_scenarios_admin on emergency_scenarios(admin_id);

-- 4. stop_work_records
create table if not exists stop_work_records (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  occurred_at timestamptz not null,
  worksite_location text not null,
  work_type text,
  reporter_name text not null,
  stop_reason text not null,
  hazard_description text,
  immediate_action text,
  corrective_action text,
  status text default '작업중지' check (status in ('작업중지','조치중','재개승인','종료')),
  restart_approved_by text,
  restart_approved_at timestamptz,
  restart_note text,
  photo_urls jsonb default '[]'::jsonb,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table stop_work_records enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='stop_work_records' and policyname='stop_work_records_admin_all') then
    create policy "stop_work_records_admin_all" on stop_work_records for all
      using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_stop_work_records_admin on stop_work_records(admin_id);
create index if not exists idx_stop_work_records_status on stop_work_records(status);

-- 5. emergency_drills
create table if not exists emergency_drills (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  drill_date date not null,
  scenario_id uuid references emergency_scenarios(id),
  drill_type text not null,
  location text not null,
  supervisor_name text,
  participant_count integer default 0,
  summary text,
  issues_found text,
  improvement_actions text,
  result_status text default '작성중' check (result_status in ('작성중','검토중','완료')),
  photo_urls jsonb default '[]'::jsonb,
  approved_by text,
  approved_at timestamptz,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table emergency_drills enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emergency_drills' and policyname='emergency_drills_admin_all') then
    create policy "emergency_drills_admin_all" on emergency_drills for all
      using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_emergency_drills_admin on emergency_drills(admin_id);
create index if not exists idx_emergency_drills_date on emergency_drills(drill_date);

-- 6. emergency_drill_attendees
create table if not exists emergency_drill_attendees (
  id uuid primary key default gen_random_uuid(),
  drill_id uuid references emergency_drills(id) on delete cascade not null,
  employee_id uuid references employees(id),
  employee_name text not null,
  attended boolean default true,
  note text,
  created_at timestamptz default now()
);
alter table emergency_drill_attendees enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emergency_drill_attendees' and policyname='emergency_drill_attendees_admin_all') then
    create policy "emergency_drill_attendees_admin_all" on emergency_drill_attendees for all using (
      exists (select 1 from emergency_drills d where d.id = drill_id and d.admin_id = auth.uid())
    ) with check (
      exists (select 1 from emergency_drills d where d.id = drill_id and d.admin_id = auth.uid())
    );
  end if;
end $$;
create index if not exists idx_emergency_drill_attendees_drill on emergency_drill_attendees(drill_id);

-- 7. Storage bucket: emergency-files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'emergency-files', 'emergency-files', true, 20971520,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated_upload_emergency_files" on storage.objects;
create policy "authenticated_upload_emergency_files" on storage.objects for insert to authenticated
  with check (bucket_id = 'emergency-files');

drop policy if exists "public_read_emergency_files" on storage.objects;
create policy "public_read_emergency_files" on storage.objects for select
  using (bucket_id = 'emergency-files');

drop policy if exists "authenticated_update_emergency_files" on storage.objects;
create policy "authenticated_update_emergency_files" on storage.objects for update to authenticated
  using (bucket_id = 'emergency-files');

drop policy if exists "authenticated_delete_emergency_files" on storage.objects;
create policy "authenticated_delete_emergency_files" on storage.objects for delete to authenticated
  using (bucket_id = 'emergency-files');
