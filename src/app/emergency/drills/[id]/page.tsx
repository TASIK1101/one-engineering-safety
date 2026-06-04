export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import DrillCompleteActions from "@/components/emergency/DrillCompleteActions";
import { drillStatusStyle, resolveEmergencyFileUrl } from "@/lib/emergency";
import type { EmergencyDrill, EmergencyDrillAttendee, EmergencyScenario } from "@/types";

export default async function DrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("emergency_drills")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();
  if (!data) notFound();
  const drill = data as EmergencyDrill;

  const [{ data: attendeesData }, scenarioRes] = await Promise.all([
    admin.from("emergency_drill_attendees").select("*").eq("drill_id", id).order("employee_name", { ascending: true }),
    drill.scenario_id
      ? admin.from("emergency_scenarios").select("scenario_type, title").eq("id", drill.scenario_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const attendees = (attendeesData ?? []) as EmergencyDrillAttendee[];
  const scenario = scenarioRes.data as Pick<EmergencyScenario, "scenario_type" | "title"> | null;

  const rows: { label: string; value: string | null }[] = [
    { label: "훈련일", value: drill.drill_date },
    { label: "훈련 유형", value: drill.drill_type },
    { label: "장소", value: drill.location },
    { label: "담당자", value: drill.supervisor_name },
    { label: "연계 시나리오", value: scenario ? `[${scenario.scenario_type}] ${scenario.title}` : null },
    { label: "참석자 수", value: `${drill.participant_count}명` },
    { label: "실시 개요", value: drill.summary },
    { label: "발견 문제점", value: drill.issues_found },
    { label: "개선 조치", value: drill.improvement_actions },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/emergency/drills" className="text-sm text-gray-500 hover:text-gray-700">← 훈련 목록</Link>
        <a href={`/records/emergency/drill/${drill.id}`} target="_blank" rel="noopener noreferrer"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">🖨️ 결과 보고서 인쇄</a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${drillStatusStyle(drill.result_status)}`}>{drill.result_status}</span>
          <h1 className="text-lg font-bold text-gray-900">{drill.drill_type} — {drill.location}</h1>
        </div>

        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td className="border border-gray-200 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700 align-top">{label}</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-800 whitespace-pre-wrap">{value || "-"}</td>
              </tr>
            ))}
            {(drill.approved_by || drill.approved_at) && (
              <>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-green-50 font-medium text-gray-700">승인자</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-800">{drill.approved_by || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-green-50 font-medium text-gray-700">승인일시</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-800">{drill.approved_at?.slice(0, 16).replace("T", " ") || "-"}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* 참석자 */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 mb-2">참석자 ({attendees.length}명)</p>
          {attendees.length === 0 ? (
            <p className="text-sm text-gray-400">참석자 정보가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {attendees.map((a) => (
                <span key={a.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{a.employee_name}</span>
              ))}
            </div>
          )}
        </div>

        {/* 사진 */}
        {drill.photo_urls?.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">현장 사진</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {drill.photo_urls.map((u, idx) => {
                const url = resolveEmergencyFileUrl(u) ?? u;
                const isPdf = url.toLowerCase().endsWith(".pdf");
                return isPdf ? (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 border border-gray-200 rounded-lg text-xs text-blue-600">📄 PDF</a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`사진 ${idx + 1}`} className="h-24 w-full object-cover rounded-lg border border-gray-200" /></a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <DrillCompleteActions drill={drill} />
    </div>
  );
}
