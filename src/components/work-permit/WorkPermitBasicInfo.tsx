import type { WorkPermit } from "@/types";

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

export default function WorkPermitBasicInfo({
  permit,
  isConfinedSpacePermit,
}: {
  permit: WorkPermit;
  isConfinedSpacePermit: boolean;
}) {
  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        기본 정보
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <InfoRow label="작업명" value={permit.work_name} />
        <InfoRow
          label="작업허가 유형"
          value={`${permit.grade}급 — ${permit.permit_type}`}
        />
        <InfoRow label="작업협력사" value={permit.work_company} />
        <InfoRow label="주관작업부서" value={permit.work_department} />
        <InfoRow label="작업장소" value={permit.work_location} />
        <InfoRow
          label="작업인원"
          value={permit.worker_count ? `${permit.worker_count}명` : null}
        />
        <InfoRow
          label="작업기간"
          value={
            permit.work_period_start
              ? `${permit.work_period_start}${permit.work_period_end ? ` ~ ${permit.work_period_end}` : ""}`
              : null
          }
        />
        <InfoRow label="관리감독자" value={permit.supervisor_name} />
        <InfoRow label="비상연락망" value={permit.emergency_contact} />
        {isConfinedSpacePermit && (
          <>
            <InfoRow label="환기방법" value={permit.ventilation_method} />
            <InfoRow label="감시자" value={permit.watcher_name} />
          </>
        )}
      </dl>
    </section>
  );
}
