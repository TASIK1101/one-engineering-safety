export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const { data: attendees } = await supabase
    .from("tbm_attendees")
    .select("*")
    .eq("tbm_record_id", id)
    .order("created_at");

  const tbm = record as TbmRecord;
  const att = (attendees ?? []) as TbmAttendee[];

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">위험성평가 일일교육 (TBM) 실시 기록</h1>
          <p className="text-xs text-gray-500 mt-1">문서번호: TBM-{tbm.date} · 출력일: {new Date().toLocaleDateString("ko-KR")}</p>
        </div>

        {/* 기본 정보 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">기본 정보</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">작성일</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.date}</td>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">협력사명</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.company ?? "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">작업장 위치</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.worksite_location ?? "-"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">공종</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.work_type}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">세부 공정명</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.process_name ?? "-"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">실시자</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.supervisor ?? "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">안전전담자</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.safety_manager ?? "-"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">소장/대표</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.site_manager ?? "-"}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">교육 실시</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.education_done ? "실시 완료" : "미실시"}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">상태</td>
                <td className="border border-gray-300 px-3 py-2">{tbm.status}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 위험요인 */}
        {tbm.hazard_items && tbm.hazard_items.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">위험요인 및 안전대책</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 w-10 text-center">번호</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium">위험요인 및 안전대책</th>
                </tr>
              </thead>
              <tbody>
                {tbm.hazard_items.map((item, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-500">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 특이사항 */}
        {(tbm.main_hazard_notes || tbm.accident_case_notes) && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">당일 특이사항</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {tbm.main_hazard_notes && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 w-36 bg-gray-50 font-medium text-gray-700 align-top">당일 주요 유해위험</td>
                    <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">{tbm.main_hazard_notes}</td>
                  </tr>
                )}
                {tbm.accident_case_notes && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700 align-top">사고사례 전파</td>
                    <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">{tbm.accident_case_notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 참석자 서명 현황 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">
            참석자 서명 현황 ({att.filter(a => a.attendance_status === "서명완료").length}/{att.length}명)
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 w-10 text-center">번호</th>
                <th className="border border-gray-300 px-3 py-2 w-28 text-left font-medium">성명</th>
                <th className="border border-gray-300 px-3 py-2 w-20 text-center font-medium">상태</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-medium">서명</th>
                <th className="border border-gray-300 px-3 py-2 w-40 text-center font-medium">서명일시</th>
              </tr>
            </thead>
            <tbody>
              {att.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-400">
                    참석자 없음
                  </td>
                </tr>
              ) : att.map((a, i) => (
                <tr key={a.id}>
                  <td className="border border-gray-300 px-3 py-2 text-center">{i + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{a.employee_name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-xs">{a.attendance_status}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center h-14">
                    {a.signature_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.signature_data} alt="서명" className="h-10 mx-auto" />
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-500">
                    {a.signed_at ? new Date(a.signed_at).toLocaleString("ko-KR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 승인 정보 */}
        {tbm.approved_by && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">승인 정보</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">승인자</td>
                  <td className="border border-gray-300 px-3 py-2">{tbm.approved_by}</td>
                  <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">승인일시</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {tbm.approved_at ? new Date(tbm.approved_at).toLocaleString("ko-KR") : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* 날인란 */}
        <section className="mt-10 border-t border-gray-300 pt-6">
          <div className="grid grid-cols-3 gap-8 text-center text-sm">
            {["작 성 자", "안전전담자", "소장 / 대표"].map((label) => (
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
