export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { resolveEmergencyFileUrl } from "@/lib/emergency";
import type { StopWorkRecord } from "@/types";

export default async function StopWorkPrintPage({
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
    .from("stop_work_records")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();
  if (!data) notFound();
  const r = data as StopWorkRecord;
  const today = new Date().toLocaleDateString("ko-KR");

  const rows: { label: string; value: string | null }[] = [
    { label: "발생 일시", value: r.occurred_at?.slice(0, 16).replace("T", " ") ?? "-" },
    { label: "작업장 위치", value: r.worksite_location },
    { label: "작업 유형", value: r.work_type },
    { label: "신고자", value: r.reporter_name },
    { label: "작업중지 사유", value: r.stop_reason },
    { label: "발견 위험요인", value: r.hazard_description },
    { label: "즉시 조치", value: r.immediate_action },
    { label: "개선 조치", value: r.corrective_action },
    { label: "현재 상태", value: r.status },
  ];

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-4xl mx-auto mb-6">
        <Link href={`/emergency/stop-work/${r.id}`} className="text-sm text-gray-500 hover:text-gray-700">← 작업중지 상세</Link>
        <PrintButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">작업중지 기록부</h1>
          <p className="text-xs text-gray-500 mt-1">출력일: {today}</p>
        </div>

        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td className="border border-gray-300 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700 align-top">{label}</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 whitespace-pre-wrap">{value || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 재개 승인 정보 */}
        <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">작업 재개 승인</h2>
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700">승인자</td>
              <td className="border border-gray-300 px-3 py-2">{r.restart_approved_by || "-"}</td>
              <td className="border border-gray-300 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700">승인일시</td>
              <td className="border border-gray-300 px-3 py-2">{r.restart_approved_at?.slice(0, 16).replace("T", " ") || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">확인 메모</td>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>{r.restart_note || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* 사진 */}
        {r.photo_urls?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 mb-2">현장 사진</h2>
            <div className="grid grid-cols-2 gap-2">
              {r.photo_urls.map((u, idx) => {
                const url = resolveEmergencyFileUrl(u) ?? u;
                if (url.toLowerCase().endsWith(".pdf")) return null;
                // eslint-disable-next-line @next/next/no-img-element
                return <img key={idx} src={url} alt={`사진 ${idx + 1}`} className="w-full object-cover border border-gray-300 rounded" />;
              })}
            </div>
          </div>
        )}

        {/* 서명란 */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {["신고자", "안전전담자", "재개 승인자"].map((role) => (
            <div key={role} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{role}</p>
              <div className="border border-gray-300 h-20 flex items-end justify-center pb-1 rounded">
                <span className="text-[10px] text-gray-300">(서명 또는 날인)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 mt-8 pt-3 flex justify-between text-xs text-gray-500">
          <span>주식회사 원엔지니어링</span>
          <span>출력일시: {new Date().toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </div>
  );
}
