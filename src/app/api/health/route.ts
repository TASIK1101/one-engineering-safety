// 진단 전용 엔드포인트 — secret key 값 자체는 절대 노출하지 않음
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!url,
    SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
    serviceKeyLength: serviceKey.length,
    urlPrefix: url.slice(0, 30) || "(없음)",
  };

  // DB 연결 테스트 — import를 동적으로 해서 모듈 로딩 실패를 격리
  let adminOk = false;
  let adminError: string | null = null;
  let employeeCount: number | null = null;
  let trainingCount: number | null = null;

  if (url && serviceKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { count: ec, error: ee } = await client
        .from("employees")
        .select("*", { count: "exact", head: true });

      if (ee) {
        adminError = `employees 오류: ${ee.message}`;
      } else {
        employeeCount = ec;
        adminOk = true;
      }

      const { count: tc } = await client
        .from("trainings")
        .select("*", { count: "exact", head: true });
      trainingCount = tc;
    } catch (e) {
      adminError = e instanceof Error ? e.message : String(e);
    }
  } else {
    adminError = "환경변수 누락: URL 또는 SERVICE_ROLE_KEY 없음";
  }

  return Response.json({
    ok: adminOk,
    env,
    adminError,
    db: adminOk ? { employeeCount, trainingCount } : null,
    ts: new Date().toISOString(),
  });
}
