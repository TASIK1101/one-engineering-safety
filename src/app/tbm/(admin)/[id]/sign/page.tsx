export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmSignListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("id", id)
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <p className="text-[11px] text-gray-400">
              주식회사 원엔지니어링 · TBM 서명
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {tbm.date} {tbm.work_type} TBM
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* TBM 내용 요약 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            오늘의 TBM 내용
          </p>
          <dl className="text-sm space-y-1.5 mb-3">
            {tbm.worksite_location && (
              <div className="flex gap-2">
                <dt className="text-gray-400 w-20 shrink-0">작업장</dt>
                <dd className="text-gray-800">{tbm.worksite_location}</dd>
              </div>
            )}
            {tbm.process_name && (
              <div className="flex gap-2">
                <dt className="text-gray-400 w-20 shrink-0">공정</dt>
                <dd className="text-gray-800">{tbm.process_name}</dd>
              </div>
            )}
            {tbm.supervisor && (
              <div className="flex gap-2">
                <dt className="text-gray-400 w-20 shrink-0">실시자</dt>
                <dd className="text-gray-800">{tbm.supervisor}</dd>
              </div>
            )}
          </dl>
          {tbm.hazard_items && tbm.hazard_items.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">
                ⚠️ 오늘의 위험요인
              </p>
              <ol className="text-xs text-amber-800 space-y-1">
                {tbm.hazard_items.slice(0, 5).map((item, i) => (
                  <li key={i}>
                    {i + 1}. {item}
                  </li>
                ))}
                {tbm.hazard_items.length > 5 && (
                  <li className="text-amber-500">
                    ... 외 {tbm.hazard_items.length - 5}개 항목
                  </li>
                )}
              </ol>
            </div>
          )}
        </div>

        {/* 참석자 목록 */}
        <p className="text-sm font-semibold text-gray-700 mb-3">
          본인 이름을 선택하여 서명하세요
        </p>

        {att.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">등록된 참석자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {att.map((a) =>
              a.attendance_status === "서명완료" ? (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <p className="font-semibold text-green-800">
                        {a.employee_name}
                      </p>
                      {a.signed_at && (
                        <p className="text-xs text-green-600">
                          {new Date(a.signed_at).toLocaleString("ko-KR")}{" "}
                          서명완료
                        </p>
                      )}
                    </div>
                  </div>
                  {a.signature_data && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.signature_data}
                      alt="서명"
                      className="h-10 border border-green-200 rounded bg-white px-1"
                    />
                  )}
                </div>
              ) : (
                <Link
                  key={a.id}
                  href={`/tbm/${id}/sign/${a.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 font-bold text-sm">
                        {a.employee_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {a.employee_name}
                      </p>
                      <p className="text-xs text-amber-600">서명 대기 중</p>
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm">서명하기 →</span>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
