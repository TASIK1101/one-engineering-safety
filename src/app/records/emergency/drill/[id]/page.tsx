export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { resolveEmergencyFileUrl } from "@/lib/emergency";
import type { EmergencyDrill, EmergencyDrillAttendee, EmergencyScenario } from "@/types";

export default async function DrillPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("emergency_drills")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();
  if (!data) notFound();
  const drill = data as EmergencyDrill;

  const [{ data: attendeesData }, scenarioRes] = await Promise.all([
    supabase.from("emergency_drill_attendees").select("*").eq("drill_id", id).order("employee_name", { ascending: true }),
    drill.scenario_id
      ? supabase.from("emergency_scenarios").select("scenario_type, title").eq("id", drill.scenario_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const attendees = (attendeesData ?? []) as EmergencyDrillAttendee[];
  const scenario = scenarioRes.data as Pick<EmergencyScenario, "scenario_type" | "title"> | null;
  const today = new Date().toLocaleDateString("ko-KR");

  const rows: { label: string; value: string | null }[] = [
    { label: "훈련일", value: drill.drill_date },
    { label: "훈련 유형", value: drill.drill_type },
    { label: "장소", value: drill.location },
    { label: "담당자", value: drill.supervisor_name },
    { label: "연계 시나리오", value: scenario ? `[${scenario.scenario_type}] ${scenario.title}` : "-" },
    { label: "참석자 수", value: `${drill.participant_count}명` },
  ];

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-4xl mx-auto mb-6">
        <Link href={`/emergency/drills/${drill.id}`} className="text-sm text-gray-500 hover:text-gray-700">← 훈련 상세</Link>
        <PrintButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">비상대응훈련 결과 보고서</h1>
          <p className="text-xs text-gray-500 mt-1">출력일: {today}</p>
        </div>

        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td className="border border-gray-300 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700">{label}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800">{value || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 참석자 목록 */}
        <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">참석자 목록 ({attendees.length}명)</h2>
        <table className="w-full border-collapse text-xs mb-6">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 w-8">No</th>
              <th className="border border-gray-300 px-2 py-2">성명</th>
              <th className="border border-gray-300 px-2 py-2 w-20">참석</th>
              <th className="border border-gray-300 px-2 py-2">비고</th>
            </tr>
          </thead>
          <tbody>
            {attendees.length === 0 ? (
              <tr><td colSpan={4} className="border border-gray-300 px-2 py-6 text-center text-gray-400">참석자 정보가 없습니다.</td></tr>
            ) : (
              attendees.map((a, idx) => (
                <tr key={a.id}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{a.employee_name}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{a.attended ? "○" : "×"}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{a.note ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 실시 결과 */}
        <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">실시 결과</h2>
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700 align-top">실시 개요</td>
              <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">{drill.summary || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700 align-top">발견 문제점</td>
              <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">{drill.issues_found || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700 align-top">개선 조치</td>
              <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">{drill.improvement_actions || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* 사진 */}
        {drill.photo_urls?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 mb-2">현장 사진</h2>
            <div className="grid grid-cols-2 gap-2">
              {drill.photo_urls.map((u, idx) => {
                const url = resolveEmergencyFileUrl(u) ?? u;
                if (url.toLowerCase().endsWith(".pdf")) return null;
                // eslint-disable-next-line @next/next/no-img-element
                return <img key={idx} src={url} alt={`사진 ${idx + 1}`} className="w-full object-cover border border-gray-300 rounded" />;
              })}
            </div>
          </div>
        )}

        {/* 승인 정보 + 서명란 */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {["훈련 담당자", "안전전담자", "소장/대표"].map((role) => (
            <div key={role} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{role}</p>
              <div className="border border-gray-300 h-20 flex items-end justify-center pb-1 rounded">
                <span className="text-[10px] text-gray-300">(서명 또는 날인)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 mt-8 pt-3 flex justify-between text-xs text-gray-500">
          <span>주식회사 원엔지니어링{drill.approved_by ? ` · 승인: ${drill.approved_by}` : ""}</span>
          <span>출력일시: {new Date().toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </div>
  );
}
