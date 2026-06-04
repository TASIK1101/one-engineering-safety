export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { drillStatusStyle } from "@/lib/emergency";
import type { EmergencyDrill } from "@/types";

export default async function DrillsListPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("emergency_drills")
    .select("*")
    .eq("admin_id", user.id)
    .order("drill_date", { ascending: false })
    .limit(300);

  const list = (data ?? []) as EmergencyDrill[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비상대응훈련</h1>
          <p className="text-sm text-gray-500 mt-1">비상대응훈련 실시 기록과 결과를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emergency" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
          <Link href="/emergency/drills/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">+ 훈련 등록</Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">훈련 기록이 없습니다.</p>
          <Link href="/emergency/drills/new" className="mt-3 inline-block text-sm text-blue-600 underline">훈련 등록</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">훈련일</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">훈련 유형</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">장소</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">참석</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-700 font-medium">{d.drill_date}</td>
                    <td className="px-3 py-3 text-gray-700">{d.drill_type}</td>
                    <td className="px-3 py-3 text-gray-600">{d.location}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{d.participant_count}명</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${drillStatusStyle(d.result_status)}`}>{d.result_status}</span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Link href={`/emergency/drills/${d.id}`} className="text-xs text-blue-600 hover:underline mr-3">상세보기</Link>
                      <a href={`/records/emergency/drill/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline">🖨️ 인쇄</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
