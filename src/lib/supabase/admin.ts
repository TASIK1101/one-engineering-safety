import { createClient } from "@supabase/supabase-js";

// 서버 전용 — 절대 클라이언트 번들에 포함하지 말 것
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error("[admin] NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.");
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    console.error("[admin] SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
