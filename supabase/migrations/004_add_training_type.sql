-- 교육 유형 필드 추가
alter table public.trainings
  add column if not exists training_type text
    not null default 'regular_training';

-- 허용 값 제약
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
