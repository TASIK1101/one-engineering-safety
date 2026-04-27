import { createClient } from "@supabase/supabase-js";

// 서버 전용 — 절대 클라이언트 번들에 포함하지 말 것
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
