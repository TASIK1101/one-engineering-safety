export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmPublicSignListPage({
  params,
}: {
  params: Promise<{ signToken: string }>;
}) {
  const { signToken } = await params;
  const supabase = await createClient();

  // sign_token으로 TBM 레코드 조회 (인증 불필요)
  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("sign_token", signToken)
    .single();

  if (!record) notFound();

  const { data: attendees } = await supabase
    .from("tbm_attendees")
    .select("*")
    .eq("tbm_record_id", record.id)
    .order("created_at");

  const tbm = record as TbmRecord;
  const att = (attendees ?? []) as TbmAttendee[];
  const signedCount = att.filter((a) => a.attendance_status === "서명완료").length;

  const isCompleted = tbm.status === "완료" || tbm.status === "검토중";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              주식회사 원엔지니어링 · TBM 위험성평가 서명
            </p>
            <p className="text-sm font-bold text-gray-900">
              {tbm.date} {tbm.work_type} TBM
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 pb-16">

        {/* 진행 상태 배너 */}
        <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${
          isCompleted
            ? "bg-green-50 border border-green-200"
            : "bg-blue-50 border border-blue-200"
        }`}>
          <span className="text-2xl">{isCompleted ? "✅" : "✍️"}</span>
          <div>
            <p className={`text-sm font-bold ${isCompleted ? "text-green-800" : "text-blue-800"}`}>
              {isCompleted ? "서명이 완료되었습니다" : `서명 진행 중 (${signedCount}/${att.length}명)`}
            </p>
            <p className={`text-xs mt-0.5 ${isCompleted ? "text-green-600" : "text-blue-600"}`}>
              {isCompleted
                ? "모든 참석자가 서명을 완료했습니다."
                : "본인 이름을 터치하여 서명해주세요."}
            </p>
          </div>
        </div>

        {/* TBM 내용 요약 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            오늘의 TBM 교육 내용
          </p>

          <dl className="space-y-2.5 mb-4">
            {tbm.worksite_location && (
              <div className="flex gap-3">
                <dt className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">작업장</dt>
                <dd className="text-sm font-medium text-gray-800">{tbm.worksite_location}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">공종</dt>
              <dd className="text-sm font-medium text-gray-800">{tbm.work_type}</dd>
            </div>
            {tbm.process_name && (
              <div className="flex gap-3">
                <dt className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">세부 공정</dt>
                <dd className="text-sm font-medium text-gray-800">{tbm.process_name}</dd>
              </div>
            )}
            {tbm.supervisor && (
              <div className="flex gap-3">
                <dt className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">실시자</dt>
                <dd className="text-sm font-medium text-gray-800">{tbm.supervisor}</dd>
              </div>
            )}
          </dl>

          {/* 위험요인 */}
          {tbm.hazard_items && tbm.hazard_items.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                <span>⚠️</span> 오늘의 위험요인 및 안전대책
              </p>
              <ol className="space-y-2">
                {tbm.hazard_items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-900">
                    <span className="font-bold text-amber-600 shrink-0 w-5">{i + 1}.</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 특이사항 */}
          {tbm.main_hazard_notes && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 mb-1.5">
                📢 당일 주요 유해위험 전달사항
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {tbm.main_hazard_notes}
              </p>
            </div>
          )}
          {tbm.accident_case_notes && (
            <div className="mt-3">
              <p className="text-xs font-bold text-gray-500 mb-1.5">
                📋 사고사례 전파 내용
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {tbm.accident_case_notes}
              </p>
            </div>
          )}
        </div>

        {/* 참석자 목록 */}
        <div>
          <p className="text-base font-bold text-gray-900 mb-3">
            👇 본인 이름을 터치하여 서명하세요
          </p>

          {att.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <p className="text-gray-400">등록된 참석자가 없습니다.</p>
              <p className="text-xs text-gray-300 mt-1">관리자에게 문의해주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {att.map((a) =>
                a.attendance_status === "서명완료" ? (
                  /* 서명 완료 */
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-green-600 text-xl font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-lg">
                          {a.employee_name}
                        </p>
                        {a.signed_at && (
                          <p className="text-xs text-green-500 mt-0.5">
                            {new Date(a.signed_at).toLocaleString("ko-KR")} 서명완료
                          </p>
                        )}
                      </div>
                    </div>
                    {a.signature_data && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.signature_data}
                        alt="서명"
                        className="h-12 border border-green-200 rounded-lg bg-white px-2"
                      />
                    )}
                  </div>
                ) : (
                  /* 서명 대기 */
                  <Link
                    key={a.id}
                    href={`/tbm/sign/${signToken}/${a.id}`}
                    className="flex items-center justify-between bg-white border-2 border-gray-200 hover:border-blue-400 active:border-blue-600 rounded-2xl p-4 transition-all active:bg-blue-50 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-bold text-xl">
                          {a.employee_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {a.employee_name}
                        </p>
                        <p className="text-sm text-amber-600 font-medium mt-0.5">
                          서명 대기 중
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold">
                      서명하기 →
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-300">
            주식회사 원엔지니어링 · TBM 위험성평가 전자서명 시스템
          </p>
        </div>
      </div>
    </div>
  );
}
