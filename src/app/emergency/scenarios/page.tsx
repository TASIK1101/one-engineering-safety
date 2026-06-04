export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { EmergencyScenario } from "@/types";

export default async function EmergencyScenariosPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("emergency_scenarios")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: true });

  const scenarios = (data ?? []) as EmergencyScenario[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비상조치 시나리오</h1>
          <p className="text-sm text-gray-500 mt-1">유형별 비상조치 및 위기대응 시나리오입니다. 상세에서 관리자가 직접 수정할 수 있습니다.</p>
        </div>
        <Link href="/emergency" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">등록된 시나리오가 없습니다.</p>
          <p className="text-xs mt-1">Supabase에서 <code className="bg-gray-100 px-1 rounded">20260604_emergency_seed.sql</code>을 실행하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <Link key={s.id} href={`/emergency/scenarios/${s.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">{s.scenario_type}</span>
                {!s.active && <span className="text-xs text-gray-400">(비활성)</span>}
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">{s.title}</h2>
              {s.overview && <p className="text-sm text-gray-500 line-clamp-2">{s.overview}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
