export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { stopWorkStatusStyle, drillStatusStyle, isInspectionDue } from "@/lib/emergency";

export default async function EmergencyDashboardPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [
    { data: contacts },
    { data: equipment },
    { data: stopWork },
    { data: drills },
    { data: scenarios },
  ] = await Promise.all([
    admin.from("emergency_contacts").select("id, active").eq("admin_id", user.id),
    admin.from("emergency_equipment").select("id, status, next_inspection_date").eq("admin_id", user.id).eq("active", true),
    admin.from("stop_work_records").select("id, worksite_location, occurred_at, status, stop_reason").eq("admin_id", user.id).order("occurred_at", { ascending: false }).limit(5),
    admin.from("emergency_drills").select("id, drill_date, drill_type, location, result_status, participant_count").eq("admin_id", user.id).order("drill_date", { ascending: false }).limit(5),
    admin.from("emergency_scenarios").select("id, scenario_type, title").eq("admin_id", user.id).eq("active", true).order("created_at", { ascending: true }),
  ]);

  const activeContacts = contacts?.filter((c) => c.active).length ?? 0;
  const equipOk = equipment?.filter((e) => e.status === "정상").length ?? 0;
  const equipNeedCheck = equipment?.filter((e) => e.status === "점검필요").length ?? 0;
  const equipUnusable = equipment?.filter((e) => e.status === "사용불가").length ?? 0;
  const equipDueSoon = equipment?.filter((e) => isInspectionDue(e.next_inspection_date)).length ?? 0;
  const activeStopWork = stopWork?.filter((r) => r.status === "작업중지" || r.status === "조치중").length ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingDrill = [...(drills ?? [])].reverse().find((d) => d.drill_date >= today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">비상대응 관리</h1>
        <p className="text-sm text-gray-500 mt-1">비상연락망 · 장비 · 시나리오 · 작업중지 · 훈련을 관리합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/emergency/contacts" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500 mb-1">비상연락망</p>
          <p className="text-2xl font-bold text-gray-900">{activeContacts}<span className="text-sm font-normal text-gray-500 ml-1">건</span></p>
        </Link>
        <Link href="/emergency/equipment" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500 mb-1">장비 정상</p>
          <p className="text-2xl font-bold text-green-700">{equipOk}<span className="text-sm font-normal text-gray-500 ml-1">개</span></p>
          {(equipNeedCheck > 0 || equipUnusable > 0) && (
            <p className="text-xs text-amber-600 mt-1">점검필요 {equipNeedCheck} · 불가 {equipUnusable}</p>
          )}
        </Link>
        <Link href="/emergency/stop-work" className={`rounded-xl border p-4 hover:shadow-md transition-shadow ${activeStopWork > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
          <p className="text-xs text-gray-500 mb-1">진행중 작업중지</p>
          <p className={`text-2xl font-bold ${activeStopWork > 0 ? "text-red-700" : "text-gray-900"}`}>{activeStopWork}<span className="text-sm font-normal text-gray-500 ml-1">건</span></p>
        </Link>
        <Link href="/emergency/drills" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500 mb-1">훈련 기록</p>
          <p className="text-2xl font-bold text-gray-900">{drills?.length ?? 0}<span className="text-sm font-normal text-gray-500 ml-1">건</span></p>
          {upcomingDrill && <p className="text-xs text-blue-600 mt-1">다음: {upcomingDrill.drill_date}</p>}
        </Link>
      </div>

      {/* 30일 이내 점검 예정 경고 */}
      {equipDueSoon > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-amber-600 text-lg">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">30일 이내 점검 예정 장비 {equipDueSoon}개</p>
            <Link href="/emergency/equipment" className="text-xs text-amber-700 underline">장비 현황 확인</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 최근 작업중지 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">최근 작업중지 기록</h2>
            <Link href="/emergency/stop-work" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {!stopWork?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">작업중지 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stopWork.map((r) => (
                <li key={r.id} className="py-2.5">
                  <Link href={`/emergency/stop-work/${r.id}`} className="flex items-start gap-2 hover:opacity-80">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 whitespace-nowrap ${stopWorkStatusStyle(r.status)}`}>{r.status}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.stop_reason}</p>
                      <p className="text-xs text-gray-500">{r.worksite_location} · {r.occurred_at?.slice(0, 10)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/emergency/stop-work/new" className="mt-3 flex items-center justify-center w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">+ 작업중지 등록</Link>
        </div>

        {/* 최근 훈련 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">최근 비상대응훈련</h2>
            <Link href="/emergency/drills" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {!drills?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">훈련 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {drills.map((d) => (
                <li key={d.id} className="py-2.5">
                  <Link href={`/emergency/drills/${d.id}`} className="flex items-start gap-2 hover:opacity-80">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 whitespace-nowrap ${drillStatusStyle(d.result_status)}`}>{d.result_status}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.drill_type} — {d.location}</p>
                      <p className="text-xs text-gray-500">{d.drill_date} · 참석 {d.participant_count}명</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/emergency/drills/new" className="mt-3 flex items-center justify-center w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">+ 훈련 등록</Link>
        </div>
      </div>

      {/* 시나리오 바로가기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">유형별 비상조치 시나리오</h2>
          <Link href="/emergency/scenarios" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
        </div>
        {!scenarios?.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 시나리오가 없습니다. (seed SQL 실행 필요)</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <Link key={s.id} href={`/emergency/scenarios/${s.id}`}
                className="flex flex-col gap-1 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors">
                <span className="text-xs font-bold text-red-700">{s.scenario_type}</span>
                <span className="text-sm text-gray-700 leading-snug">{s.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
