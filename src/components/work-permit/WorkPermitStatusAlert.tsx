import type { WorkPermit, WorkPermitItem } from "@/types";
import WorkPermitResubmitForm from "@/components/work-permit/WorkPermitResubmitForm";

export default function WorkPermitStatusAlert({
  permit,
  checklistItems,
}: {
  permit: WorkPermit;
  checklistItems: WorkPermitItem[];
}) {
  if (permit.status === "반려") {
    return (
      <div className="mb-5 bg-red-50 border border-red-300 rounded-xl p-5">
        <p className="text-sm font-bold text-red-700 mb-1">⛔ 반려된 작업허가서</p>
        {permit.rejection_reason && (
          <p className="text-sm text-red-600 mb-3 leading-relaxed">
            {permit.rejection_reason}
          </p>
        )}
        <WorkPermitResubmitForm permit={permit} checklistItems={checklistItems} />
      </div>
    );
  }

  if (permit.status === "작업중지") {
    return (
      <div className="mb-5 bg-red-600 border border-red-700 rounded-xl p-4">
        <p className="text-base font-bold text-white">🚫 작업중지 처리됨</p>
        {permit.rejection_reason && (
          <p className="text-sm text-red-100 mt-1">{permit.rejection_reason}</p>
        )}
      </div>
    );
  }

  if (permit.status === "승인완료") {
    return (
      <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
        <span className="text-green-600 text-lg">✅</span>
        <div>
          <p className="text-sm font-semibold text-green-800">
            승인완료된 작업허가서입니다.
          </p>
          {permit.approved_by && (
            <p className="text-xs text-green-600 mt-0.5">
              승인자: {permit.approved_by} ·{" "}
              {permit.approved_at
                ? new Date(permit.approved_at).toLocaleString("ko-KR")
                : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
