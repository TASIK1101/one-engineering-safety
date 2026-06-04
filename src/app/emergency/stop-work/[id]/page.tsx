export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import StopWorkActions from "@/components/emergency/StopWorkActions";
import { stopWorkStatusStyle, resolveEmergencyFileUrl } from "@/lib/emergency";
import type { StopWorkRecord } from "@/types";

export default async function StopWorkDetailPage({
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
    .from("stop_work_records")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (!data) notFound();
  const r = data as StopWorkRecord;

  const rows: { label: string; value: string | null }[] = [
    { label: "발생 일시", value: r.occurred_at?.slice(0, 16).replace("T", " ") ?? "-" },
    { label: "작업장 위치", value: r.worksite_location },
    { label: "작업 유형", value: r.work_type },
    { label: "신고자", value: r.reporter_name },
    { label: "작업중지 사유", value: r.stop_reason },
    { label: "발견 위험요인", value: r.hazard_description },
    { label: "즉시 조치", value: r.immediate_action },
    { label: "개선 조치", value: r.corrective_action },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/emergency/stop-work" className="text-sm text-gray-500 hover:text-gray-700">← 작업중지 목록</Link>
        <a href={`/records/emergency/stop-work/${r.id}`} target="_blank" rel="noopener noreferrer"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">🖨️ 인쇄</a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${stopWorkStatusStyle(r.status)}`}>{r.status}</span>
          <h1 className="text-lg font-bold text-gray-900">{r.stop_reason}</h1>
        </div>

        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label}>
                <td className="border border-gray-200 px-3 py-2 w-32 bg-gray-50 font-medium text-gray-700 align-top">{label}</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-800 whitespace-pre-wrap">{value || "-"}</td>
              </tr>
            ))}
            {r.status === "재개승인" || r.status === "종료" ? (
              <>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-amber-50 font-medium text-gray-700">재개 승인자</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-800">{r.restart_approved_by || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-amber-50 font-medium text-gray-700">재개 승인일시</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-800">{r.restart_approved_at?.slice(0, 16).replace("T", " ") || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-amber-50 font-medium text-gray-700">재개 확인 메모</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-800 whitespace-pre-wrap">{r.restart_note || "-"}</td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>

        {/* 사진 */}
        {r.photo_urls?.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">현장 사진</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {r.photo_urls.map((u, idx) => {
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

      <StopWorkActions record={r} />
    </div>
  );
}
