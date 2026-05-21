export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TBMStatusBadge from "@/components/tbm/TBMStatusBadge";
import TBMApproveBox from "@/components/tbm/TBMApproveBox";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const signedCount = att.filter((a) => a.attendance_status === "서명완료").length;
  const pendingCount = att.filter((a) => a.attendance_status === "대기").length;

  const isLocked = tbm.status === "완료";
  const isRejected = tbm.status === "반려";
  const canApprove = tbm.status === "검토중";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const signUrl = `${appUrl}/tbm/${id}/sign`;

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <div className="mb-2">
            <Link href="/tbm" className="text-sm text-gray-400 hover:text-gray-600">
              ← TBM 목록
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <TBMStatusBadge status={tbm.status} />
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              {tbm.work_type}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {tbm.date} {tbm.work_type} TBM
            {tbm.process_name && (
              <span className="text-gray-500 font-normal ml-2 text-lg">
                — {tbm.process_name}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* 반려 사유 */}
      {isRejected && tbm.rejection_reason && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">⚠️ 반려 사유</p>
          <p className="text-sm text-red-600">{tbm.rejection_reason}</p>
        </div>
      )}

      {/* 잠금 안내 */}
      {isLocked && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <p className="text-sm text-green-700 font-medium">
            완료된 TBM입니다. 수정할 수 없습니다.
          </p>
        </div>
      )}

      {/* 기본 정보 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          기본 정보
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow label="작성일" value={tbm.date} />
          <InfoRow label="협력사명" value={tbm.company} />
          <InfoRow label="작업장 위치" value={tbm.worksite_location} />
          <InfoRow label="공종" value={tbm.work_type} />
          <InfoRow label="세부 공정명" value={tbm.process_name} />
          <InfoRow label="실시자" value={tbm.supervisor} />
          <InfoRow label="안전전담자" value={tbm.safety_manager} />
          <InfoRow label="소장/대표" value={tbm.site_manager} />
          <InfoRow
            label="교육 실시"
            value={tbm.education_done ? "실시 완료" : "미실시"}
          />
        </dl>
      </section>

      {/* 위험요인 */}
      {tbm.hazard_items && tbm.hazard_items.length > 0 && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            ⚠️ 위험요인 및 안전대책
          </h2>
          <ol className="space-y-2">
            {tbm.hazard_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="font-bold text-amber-600 shrink-0">{i + 1}.</span>
                <span className="text-gray-800">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 특이사항 */}
      {(tbm.main_hazard_notes || tbm.accident_case_notes) && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            📝 당일 특이사항
          </h2>
          {tbm.main_hazard_notes && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                당일 주요 유해위험 전달사항
              </p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {tbm.main_hazard_notes}
              </p>
            </div>
          )}
          {tbm.accident_case_notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                사고사례 전파 내용
              </p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {tbm.accident_case_notes}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 참석자 현황 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            👥 참석자 서명 현황
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600 font-semibold">
              서명완료 {signedCount}명
            </span>
            <span className="text-amber-600">대기 {pendingCount}명</span>
          </div>
        </div>

        {att.length === 0 ? (
          <p className="text-gray-400 text-sm">참석자가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {att.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.employee_name}
                  </p>
                  {a.signed_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(a.signed_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {a.signature_data && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.signature_data}
                      alt="서명"
                      className="h-8 border border-gray-200 rounded bg-white px-1"
                    />
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.attendance_status === "서명완료"
                        ? "bg-green-100 text-green-700"
                        : a.attendance_status === "불참"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.attendance_status}
                  </span>
                  {!isLocked && a.attendance_status === "대기" && (
                    <Link
                      href={`/tbm/${id}/sign/${a.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-2 py-0.5 transition-colors"
                    >
                      서명하기
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 서명 링크 공유 */}
        {!isLocked && att.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">
              📱 근로자 서명 링크
            </p>
            <p className="text-xs text-blue-500 break-all mb-3 leading-relaxed">{signUrl}</p>
            <Link
              href={`/tbm/${id}/sign`}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              근로자 서명 링크 열기 →
            </Link>
          </div>
        )}
      </section>

      {/* 승인/반려 박스 */}
      {(canApprove || isRejected) && (
        <TBMApproveBox tbmId={id} canApprove={canApprove} />
      )}

      {/* 완료 정보 */}
      {isLocked && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            ✅ 승인 정보
          </h2>
          <dl className="text-sm space-y-2">
            <InfoRow label="승인자" value={tbm.approved_by} />
            <InfoRow
              label="승인일시"
              value={
                tbm.approved_at
                  ? new Date(tbm.approved_at).toLocaleString("ko-KR")
                  : null
              }
            />
          </dl>
        </section>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="font-medium text-gray-900">{value || "-"}</dd>
    </div>
  );
}
