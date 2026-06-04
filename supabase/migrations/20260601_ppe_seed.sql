-- ============================================================
-- 보호구 품목 초기 데이터 seed (안전대 3종)
-- Supabase SQL Editor에서 로그인한 관리자 계정으로 실행하세요.
--
-- ⚠️ admin_id 는 "현재 로그인한 관리자(auth.uid())" 기준으로 들어갑니다.
--    SQL Editor에서 실행 시 auth.uid() 가 null 일 수 있으므로,
--    아래 둘 중 하나를 선택하세요.
-- ============================================================

-- ── 방법 A: 특정 이메일 관리자에게 seed (권장) ────────────────
-- 'admin@example.com' 부분을 실제 관리자 이메일로 바꾸세요.
with target_admin as (
  select id as admin_id from auth.users where email = 'admin@example.com' limit 1
)
insert into ppe_items (admin_id, item_name, category, model_name, certification_number, certification_agency, description, active)
select t.admin_id, v.item_name, v.category, v.model_name, v.certification_number, v.certification_agency, v.description, true
from target_admin t
cross join (values
  ('안전대 KJ052-DS02',  '안전대', 'KJ052-DS02',  '11-AV2CY-0157', '한국산업안전보건공단', '안전그네식, 1개걸이용'),
  ('안전대 SAHSE1-2025', '안전대', 'SAHSE1-2025', '12-AV2CY-0109', '한국산업안전보건공단', '안전그네식, 1개걸이용'),
  ('안전대 K051-1712',   '안전대', 'K051-1712',   '17-AV2CY-0027', '한국산업안전보건공단', '안전그네식, 1개걸이용')
) as v(item_name, category, model_name, certification_number, certification_agency, description)
-- 동일 인증번호 중복 seed 방지
where not exists (
  select 1 from ppe_items p
  where p.admin_id = t.admin_id and p.certification_number = v.certification_number
);

-- ── 방법 B: 직접 admin_id UUID 를 넣어 seed ──────────────────
-- 위 방법 A 대신 사용하려면 아래 주석을 풀고 'YOUR-ADMIN-UUID' 를 교체하세요.
--
-- insert into ppe_items (admin_id, item_name, category, model_name, certification_number, certification_agency, description, active)
-- values
--   ('YOUR-ADMIN-UUID', '안전대 KJ052-DS02',  '안전대', 'KJ052-DS02',  '11-AV2CY-0157', '한국산업안전보건공단', '안전그네식, 1개걸이용', true),
--   ('YOUR-ADMIN-UUID', '안전대 SAHSE1-2025', '안전대', 'SAHSE1-2025', '12-AV2CY-0109', '한국산업안전보건공단', '안전그네식, 1개걸이용', true),
--   ('YOUR-ADMIN-UUID', '안전대 K051-1712',   '안전대', 'K051-1712',   '17-AV2CY-0027', '한국산업안전보건공단', '안전그네식, 1개걸이용', true);
