-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Employees table
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  department text not null default '',
  created_at timestamptz not null default now()
);

-- Trainings table
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  content text not null,
  -- quizzes: [{question: string, answer: "O"|"X"}]
  quizzes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Training assignments (직원별 교육 링크 + 완료 기록)
create table public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  quiz_answers jsonb,        -- ["O","X","O"] 형태
  signature_data text,       -- base64 PNG
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(training_id, employee_id)
);

-- Row Level Security
alter table public.employees enable row level security;
alter table public.trainings enable row level security;
alter table public.training_assignments enable row level security;

-- Employees: 관리자 본인 데이터만 접근
create policy "admin_own_employees" on public.employees
  for all using (auth.uid() = admin_id);

-- Trainings: 관리자 본인 데이터만 접근
create policy "admin_own_trainings" on public.trainings
  for all using (auth.uid() = admin_id);

-- Assignments: 관리자는 본인 교육의 assignment만 접근
create policy "admin_own_assignments" on public.training_assignments
  for all using (
    exists (
      select 1 from public.trainings t
      where t.id = training_assignments.training_id
        and t.admin_id = auth.uid()
    )
  );

-- 직원(비로그인)은 token으로 assignment 조회 가능 (anon role)
create policy "public_read_by_token" on public.training_assignments
  for select using (true);

-- 직원(비로그인)은 pending인 assignment를 완료 처리 가능
create policy "public_complete_by_token" on public.training_assignments
  for update using (status = 'pending');

-- 직원이 교육 내용 읽기 (training token으로 접근 시)
create policy "public_read_training" on public.trainings
  for select using (true);

-- 직원이 자기 정보 읽기
create policy "public_read_employee" on public.employees
  for select using (true);
