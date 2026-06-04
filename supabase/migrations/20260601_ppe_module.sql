-- ============================================================
-- 보호구 지급·관리 모듈 (PPE) 마이그레이션
-- Supabase SQL Editor에서 그대로 복붙하여 실행하세요.
-- 기존 TBM / 안전점검 / 시정조치 / 작업허가서 테이블은 건드리지 않습니다.
-- ============================================================

-- ── 1. 보호구 품목 마스터 ─────────────────────────────────────
create table if not exists ppe_items (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  item_name text not null,
  category text not null,
  model_name text,
  manufacturer text,
  certification_number text,
  certification_date date,
  certification_agency text,
  certificate_file_url text,
  replacement_cycle_months integer,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ppe_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ppe_items' and policyname='ppe_items_admin_all') then
    create policy "ppe_items_admin_all" on ppe_items for all using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_ppe_items_admin on ppe_items(admin_id);

-- ── 2. 보호구 지급 내역 ───────────────────────────────────────
create table if not exists ppe_issuances (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  employee_id uuid references employees(id) not null,
  ppe_item_id uuid references ppe_items(id) not null,
  issued_at date not null,
  quantity integer default 1,
  status text default '지급중' check (status in ('지급중','반납완료','교체완료','분실','폐기')),
  expected_replacement_date date,
  returned_at date,
  replaced_at date,
  issue_reason text,
  note text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ppe_issuances enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ppe_issuances' and policyname='ppe_issuances_admin_all') then
    create policy "ppe_issuances_admin_all" on ppe_issuances for all using (auth.uid() = admin_id) with check (auth.uid() = admin_id);
  end if;
end $$;
create index if not exists idx_ppe_issuances_admin on ppe_issuances(admin_id);
create index if not exists idx_ppe_issuances_employee on ppe_issuances(employee_id);
create index if not exists idx_ppe_issuances_item on ppe_issuances(ppe_item_id);

-- ── 3. 지급 이력(액션 로그) ───────────────────────────────────
create table if not exists ppe_issue_history (
  id uuid primary key default gen_random_uuid(),
  issuance_id uuid references ppe_issuances(id) on delete cascade not null,
  action_type text not null check (action_type in ('지급','반납','교체','분실','폐기','수정')),
  action_date timestamptz default now(),
  actor_name text,
  note text,
  created_at timestamptz default now()
);
alter table ppe_issue_history enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ppe_issue_history' and policyname='ppe_issue_history_admin_all') then
    create policy "ppe_issue_history_admin_all" on ppe_issue_history for all using (
      exists (select 1 from ppe_issuances i where i.id = issuance_id and i.admin_id = auth.uid())
    ) with check (
      exists (select 1 from ppe_issuances i where i.id = issuance_id and i.admin_id = auth.uid())
    );
  end if;
end $$;
create index if not exists idx_ppe_issue_history_issuance on ppe_issue_history(issuance_id);

-- ── 4. 인증서 ─────────────────────────────────────────────────
create table if not exists ppe_certificates (
  id uuid primary key default gen_random_uuid(),
  ppe_item_id uuid references ppe_items(id) on delete cascade not null,
  certificate_name text not null,
  certification_number text,
  certification_date date,
  certification_agency text,
  model_name text,
  manufacturer text,
  file_url text,
  created_at timestamptz default now()
);
alter table ppe_certificates enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='ppe_certificates' and policyname='ppe_certificates_admin_all') then
    create policy "ppe_certificates_admin_all" on ppe_certificates for all using (
      exists (select 1 from ppe_items it where it.id = ppe_item_id and it.admin_id = auth.uid())
    ) with check (
      exists (select 1 from ppe_items it where it.id = ppe_item_id and it.admin_id = auth.uid())
    );
  end if;
end $$;
create index if not exists idx_ppe_certificates_item on ppe_certificates(ppe_item_id);

-- ── 5. Storage 버킷: ppe-certificates ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ppe-certificates',
  'ppe-certificates',
  true,
  10485760,  -- 10 MB (PDF 포함)
  array['image/jpeg','image/png','application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated_upload_ppe_certificates" on storage.objects;
create policy "authenticated_upload_ppe_certificates"
on storage.objects for insert to authenticated
with check (bucket_id = 'ppe-certificates');

drop policy if exists "public_read_ppe_certificates" on storage.objects;
create policy "public_read_ppe_certificates"
on storage.objects for select
using (bucket_id = 'ppe-certificates');

drop policy if exists "authenticated_update_ppe_certificates" on storage.objects;
create policy "authenticated_update_ppe_certificates"
on storage.objects for update to authenticated
using (bucket_id = 'ppe-certificates');

drop policy if exists "authenticated_delete_ppe_certificates" on storage.objects;
create policy "authenticated_delete_ppe_certificates"
on storage.objects for delete to authenticated
using (bucket_id = 'ppe-certificates');
