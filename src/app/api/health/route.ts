import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 진단 전용 엔드포인트 — 키 값 자체는 절대 노출하지 않음
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!url,
    SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
    serviceKeyLength: serviceKey.length,
    urlPrefix: url.slice(0, 30) || "(없음)",
  };

  // admin client 연결 테스트
  let adminOk = false;
  let adminError: string | null = null;
  let employeeCount: number | null = null;
  let trainingCount: number | null = null;

  if (url && serviceKey) {
    try {
      const client = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { count: ec, error: ee } = await client
        .from("employees")
        .select("*", { count: "exact", head: true });

      if (ee) {
        adminError = `employees 조회 실패: ${ee.message} (code: ${ee.code})`;
      } else {
        employeeCount = ec;
        adminOk = true;
      }

      const { count: tc } = await client
        .from("trainings")
        .select("*", { count: "exact", head: true });
      trainingCount = tc;
    } catch (e) {
      adminError = String(e);
    }
  } else {
    adminError = "환경변수 누락 — URL 또는 SERVICE_ROLE_KEY 없음";
  }

  return NextResponse.json({
    ok: adminOk,
    env: envCheck,
    adminError,
    db: adminOk ? { employeeCount, trainingCount } : null,
    ts: new Date().toISOString(),
  });
}
