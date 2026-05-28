import type { WorkPermitApproval } from "@/types";

export default function WorkPermitApprovalHistory({
  approvals,
}: {
  approvals: WorkPermitApproval[];
}) {
  if (approvals.length === 0) return null;

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        📝 승인 이력
      </h2>
      <div className="space-y-2">
        {approvals.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
          >
            <div>
              <span className="font-medium text-gray-800">{a.approver_name}</span>
              <span className="text-gray-400 text-xs ml-2">{a.approver_role}</span>
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
  );
}
