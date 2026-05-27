export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type {
  WorkPermit,
  WorkPermitItem,
  WorkPermitWorker,
  WorkPermitApproval,
  WorkPermitGasMeasurement,
  ConfinedSpaceEntryLog,
  RelatedCompanyAgreement,
} from "@/types";
import { isConfinedSpace, isRailWork } from "@/lib/work-permit-types";
import {
  WorkPermitStatusBadge,
  WorkPermitGradeBadge,
} from "@/components/work-permit/WorkPermitStatusBadge";
import WorkPermitApproveBox from "@/components/work-permit/WorkPermitApproveBox";
import WorkPermitSignLinkBox from "@/components/work-permit/WorkPermitSignLinkBox";
import GasMeasurementBox from "@/components/work-permit/GasMeasurementBox";
import WorkPermitResubmitForm from "@/components/work-permit/WorkPermitResubmitForm";
import ConfinedSpaceEntryLogBox from "@/components/work-permit/ConfinedSpaceEntryLogBox";
import RelatedCompanyAgreementBox from "@/components/work-permit/RelatedCompanyAgreementBox";

export default async function WorkPermitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: permit } = await supabase
    .from("work_permits")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!permit) notFound();

  const isConfinedSpacePermit = isConfinedSpace(permit.permit_type);
  const isRailWorkPermit = isRailWork(permit.permit_type);

  const [
    { data: items },
    { data: workers },
    { data: approvals },
    { data: gasMeasurements },
    { data: entryLogs },
    { data: agreements },
  ] = await Promise.all([
    supabase
      .from("work_permit_items")
      .select("*")
      .eq("permit_id", id)
      .order("created_at"),
    supabase
      .from("work_permit_workers")
      .select("*")
      .eq("permit_id", id)
      .order("created_at"),
    supabase
      .from("work_permit_approvals")
      .select("*")
      .eq("permit_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("work_permit_gas_measurements")
      .select("*")
      .eq("permit_id", id)
      .order("measured_at", { ascending: false }),
    isConfinedSpacePermit
      ? supabase
          .from("confined_space_entry_logs")
          .select("*")
          .eq("permit_id", id)
          .order("entry_time", { ascending: true })
      : Promise.resolve({ data: [] }),
    isRailWorkPermit
      ? supabase
          .from("related_company_agreements")
          .select("*")
          .eq("permit_id", id)
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const p = permit as WorkPermit;
  const checklistItems = (items ?? []) as WorkPermitItem[];
  const workerList = (workers ?? []) as WorkPermitWorker[];
  const approvalList = (approvals ?? []) as WorkPermitApproval[];
  const gasList = (gasMeasurements ?? []) as WorkPermitGasMeasurement[];
  const logList = (entryLogs ?? []) as ConfinedSpaceEntryLog[];
  const agreementList = (agreements ?? []) as RelatedCompanyAgreement[];

  const signedCount = workerList.filter((w) => w.signed_at).length;
  const isLocked = p.status === "승인완료" || p.status === "작업중지";
  const isRejected = p.status === "반려";

  const checklistByCategory = checklistItems.reduce<Record<string, WorkPermitItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
        <div className="min-w-0 flex-1">
          <div className="mb-2">
            <Link
              href="/work-permits"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← 작업허가서 목록
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <WorkPermitGradeBadge grade={p.grade} />
            <WorkPermitStatusBadge status={p.status} />
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              {p.permit_type}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {p.work_name || p.title}
          </h1>
        </div>
        <Link
          href={`/records/work-permit/${id}`}
          target="_blank"
          className="shrink-0 ml-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          🖨️ 출력
        </Link>
      </div>

      {/* 반려 사유 */}
      {isRejected && (
        <div className="mb-5 bg-red-50 border border-red-300 rounded-xl p-5">
          <p className="text-sm font-bold text-red-700 mb-1">⛔ 반려된 작업허가서</p>
          {p.rejection_reason && (
            <p className="text-sm text-red-600 mb-3 leading-relaxed">
              {p.rejection_reason}
            </p>
          )}
          <WorkPermitResubmitForm permit={p} checklistItems={checklistItems} />
        </div>
      )}

      {/* 작업중지 알림 */}
      {p.status === "작업중지" && (
        <div className="mb-5 bg-red-600 border border-red-700 rounded-xl p-4">
          <p className="text-base font-bold text-white">🚫 작업중지 처리됨</p>
          {p.rejection_reason && (
            <p className="text-sm text-red-100 mt-1">{p.rejection_reason}</p>
          )}
        </div>
      )}

      {/* 승인완료 알림 */}
      {p.status === "승인완료" && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
          <span className="text-green-600 text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              승인완료된 작업허가서입니다.
            </p>
            {p.approved_by && (
              <p className="text-xs text-green-600 mt-0.5">
                승인자: {p.approved_by} ·{" "}
                {p.approved_at
                  ? new Date(p.approved_at).toLocaleString("ko-KR")
                  : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          기본 정보
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow label="작업명" value={p.work_name} />
          <InfoRow
            label="작업허가 유형"
            value={`${p.grade}급 — ${p.permit_type}`}
          />
          <InfoRow label="작업협력사" value={p.work_company} />
          <InfoRow label="주관작업부서" value={p.work_department} />
          <InfoRow label="작업장소" value={p.work_location} />
          <InfoRow
            label="작업인원"
            value={p.worker_count ? `${p.worker_count}명` : null}
          />
          <InfoRow
            label="작업기간"
            value={
              p.work_period_start
                ? `${p.work_period_start}${p.work_period_end ? ` ~ ${p.work_period_end}` : ""}`
                : null
            }
          />
          <InfoRow label="관리감독자" value={p.supervisor_name} />
          <InfoRow label="비상연락망" value={p.emergency_contact} />
          {isConfinedSpacePermit && (
            <>
              <InfoRow label="환기방법" value={p.ventilation_method} />
              <InfoRow label="감시자" value={p.watcher_name} />
            </>
          )}
        </dl>
      </section>

      {/* 체크리스트 */}
      {checklistItems.length > 0 && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            ☑️ 작업 전 체크리스트
          </h2>
          <div className="space-y-4">
            {Object.entries(checklistByCategory).map(([category, catItems]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg mb-2">
                  {category}
                </p>
                <div className="space-y-1">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                    >
                      <span
                        className={`text-sm flex-1 ${
                          item.apply_status === "해당없음"
                            ? "text-gray-400 line-through"
                            : "text-gray-800"
                        }`}
                      >
                        {item.item_text}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            item.apply_status === "신청"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {item.apply_status}
                        </span>
                        {item.field_confirmed && (
                          <span className="text-xs text-green-600 font-semibold">
                            ✓ 확인
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 밀폐구역: 가스 측정 */}
      {isConfinedSpacePermit && (
        <GasMeasurementBox
          permitId={id}
          measurements={gasList}
          isLocked={isLocked}
        />
      )}

      {/* 밀폐구역: 출입 관리대장 */}
      {isConfinedSpacePermit && (
        <ConfinedSpaceEntryLogBox
          permitId={id}
          logs={logList}
          isLocked={isLocked}
        />
      )}

      {/* 레일 위 작업: 관련 협력사 합의 */}
      {isRailWorkPermit && (
        <RelatedCompanyAgreementBox
          permitId={id}
          agreements={agreementList}
          isLocked={isLocked}
        />
      )}

      {/* 작업 인원 서명 현황 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            👷 작업 인원 서명 현황
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600 font-semibold">
              서명완료 {signedCount}명
            </span>
            <span className="text-amber-600">
              대기 {workerList.length - signedCount}명
            </span>
          </div>
        </div>

        {workerList.length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 작업자가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {workerList.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {w.worker_name}
                    {w.is_manual && w.company_name && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        ({w.company_name})
                      </span>
                    )}
                  </p>
                  {w.signed_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(w.signed_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {w.signature_data && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.signature_data}
                      alt={`${w.worker_name} 서명`}
                      className="h-8 border border-gray-200 rounded bg-white px-1"
                    />
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      w.signed_at
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {w.signed_at ? "서명완료" : "대기"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 서명 링크 */}
        {!isLocked && !isRejected && (
          <WorkPermitSignLinkBox permitToken={p.permit_token} />
        )}
      </section>

      {/* 승인 이력 */}
      {approvalList.length > 0 && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📝 승인 이력
          </h2>
          <div className="space-y-2">
            {approvalList.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    {a.approver_name}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {a.approver_role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      a.approval_status === "승인"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : a.approval_status === "반려"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {a.approval_status}
                  </span>
                  {a.approved_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(a.approved_at).toLocaleString("ko-KR")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 승인/반려/중지 박스 (반려·중지 상태에서는 숨김) */}
      <WorkPermitApproveBox permitId={id} status={p.status} />
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
