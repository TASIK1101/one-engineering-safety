export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import type { CorrectiveAction } from "@/types";
import { resolvePhotoUrl } from "@/lib/photo-url";

export default async function CorrectiveActionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const ca = record as CorrectiveAction;

  // 연결된 점검 정보 (있으면)
  let inspectionInfo: { inspection_date: string; inspection_area: string } | null = null;
  if (ca.inspection_id) {
    const { data } = await supabase
      .from("safety_inspections")
      .select("inspection_date,inspection_area")
      .eq("id", ca.inspection_id)
      .single();
    inspectionInfo = data;
  }

  const statusColors: Record<string, string> = {
    대기:   "text-gray-600",
    조치중: "text-blue-700",
    검토중: "text-amber-700",
    완료:   "text-green-700",
    반려:   "text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* 화면 전용 상단 바 */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-4xl mx-auto mb-6">
        <Link href="/records" className="text-sm text-gray-500 hover:text-gray-700">
          ← 통합 기록 보관함
        </Link>
        <PrintButton />
      </div>

      {/* 문서 본문 */}
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">

        {/* 문서 헤더 */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">시정조치 처리 기록</h1>
          <p className="text-xs text-gray-500 mt-1">
            문서번호: CA-{(ca.created_at as string).substring(0, 10)}
          </p>
        </div>

        {/* 기본 정보 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">기본 정보</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">문제항목</td>
                <td className="border border-gray-300 px-3 py-2 font-semibold" colSpan={3}>{ca.issue_title}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">상태</td>
                <td className={`border border-gray-300 px-3 py-2 font-bold ${statusColors[ca.status] ?? ""}`}>
                  {ca.status}
                </td>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">접수일</td>
                <td className="border border-gray-300 px-3 py-2">
                  {(ca.created_at as string).substring(0, 10)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">담당자</td>
                <td className="border border-gray-300 px-3 py-2">{ca.assigned_to ?? "-"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">조치기한</td>
                <td className="border border-gray-300 px-3 py-2">{ca.due_date ?? "-"}</td>
              </tr>
              {inspectionInfo && (
                <tr>
                  <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">출처 점검</td>
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-gray-600">
                    {inspectionInfo.inspection_date} · {inspectionInfo.inspection_area} 안전점검
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 문제 내용 */}
        {ca.issue_description && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">문제 내용</h2>
            <div className="border border-gray-300 px-4 py-3 text-sm whitespace-pre-wrap min-h-16">
              {ca.issue_description}
            </div>
          </section>
        )}

        {/* 반려 사유 */}
        {ca.rejection_reason && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-red-100 border border-red-300 px-3 py-1.5 text-red-800">반려 사유</h2>
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {ca.rejection_reason}
            </div>
          </section>
        )}

        {/* 사진 영역 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">조치 전·후 사진</h2>
          <div className="grid grid-cols-2 gap-4 border border-gray-300 p-4">
            {/* 조치 전 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">조치 전</p>
              {resolvePhotoUrl(ca.before_photo_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvePhotoUrl(ca.before_photo_url)!}
                  alt="조치 전 사진"
                  className="w-full max-h-48 object-contain border border-gray-200 rounded"
                />
              ) : (
                <div className="h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                  사진 없음
                </div>
              )}
            </div>
            {/* 조치 후 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">조치 후</p>
              {resolvePhotoUrl(ca.after_photo_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvePhotoUrl(ca.after_photo_url)!}
                  alt="조치 후 사진"
                  className="w-full max-h-48 object-contain border border-gray-200 rounded"
                />
              ) : (
                <div className="h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                  사진 없음
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 조치 결과 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">조치 결과</h2>
          <div className="border border-gray-300 px-4 py-3 text-sm whitespace-pre-wrap min-h-16">
            {ca.action_result ?? "—"}
          </div>
        </section>

        {/* 처리 이력 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">처리 이력</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">접수일</td>
                <td className="border border-gray-300 px-3 py-2">{(ca.created_at as string).substring(0, 10)}</td>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">완료일</td>
                <td className="border border-gray-300 px-3 py-2">
                  {ca.completed_at ? new Date(ca.completed_at).toLocaleDateString("ko-KR") : "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">승인자</td>
                <td className="border border-gray-300 px-3 py-2">{ca.approved_by ?? "—"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">승인일시</td>
                <td className="border border-gray-300 px-3 py-2">
                  {ca.approved_at ? new Date(ca.approved_at).toLocaleString("ko-KR") : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 날인란 */}
        <section className="mt-10 border-t border-gray-300 pt-6">
          <div className="grid grid-cols-3 gap-8 text-center text-sm">
            {["담 당 자", "관리책임자", "소 장"].map((label) => (
              <div key={label}>
                <p className="font-medium text-gray-700 mb-8">{label}</p>
                <div className="border-b border-gray-400 h-12" />
                <p className="text-xs text-gray-400 mt-1">(서명 또는 날인)</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
