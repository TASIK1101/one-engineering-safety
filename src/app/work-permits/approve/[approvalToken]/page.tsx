export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import LogoMark from "@/components/ui/LogoMark";
import WorkPermitApprovalFlow from "@/components/work-permit/WorkPermitApprovalFlow";

export default async function WorkPermitApprovalPage({
  params,
}: {
  params: Promise<{ approvalToken: string }>;
}) {
  const { approvalToken } = await params;
  const admin = createAdminClient();

  const { data: approval } = await admin
    .from("work_permit_approvals")
    .select(
      "id, permit_id, approver_role, approver_employee_id, approver_name, approval_status, signature_data, rejection_reason, approved_at"
    )
    .eq("approval_token", approvalToken)
    .maybeSingle();

  if (!approval || !approval.approver_employee_id) {
    return <InvalidLink />;
  }

  const { data: permit } = await admin
    .from("work_permits")
    .select(
      "grade, permit_type, work_name, work_location, work_period_start, work_period_end, status"
    )
    .eq("id", approval.permit_id)
    .single();

  if (!permit) return <InvalidLink />;

  const alreadyDone =
    approval.approval_status === "승인" || approval.approval_status === "반려";
  const isPermitLocked =
    permit.status === "승인완료" || permit.status === "작업중지";

  const roleLabel =
    approval.approver_role === "작성자"
      ? "작성자 승인"
      : approval.approver_role === "안전전담자"
      ? "안전전담자 승인"
      : "소장/대표 승인";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              주식회사 원엔지니어링 · 작업허가서 {roleLabel}
            </p>
            <p className="text-sm font-bold text-gray-900">
              {permit.grade}급 — {permit.permit_type}
              {permit.work_name ? ` (${permit.work_name})` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {alreadyDone ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">
                {approval.approval_status === "승인" ? "✅" : "❌"}
              </span>
              <p className="text-base font-bold text-gray-800 mb-1">
                {approval.approval_status === "승인"
                  ? "이미 승인 완료되었습니다"
                  : "이미 반려 처리되었습니다"}
              </p>
              {approval.approved_at && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(approval.approved_at).toLocaleString("ko-KR")}
                </p>
              )}
              {approval.approval_status === "반려" && approval.rejection_reason && (
                <p className="text-sm text-red-500 mt-2">
                  사유: {approval.rejection_reason}
                </p>
              )}
            </div>
          ) : isPermitLocked ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">
                {permit.status === "작업중지" ? "🚫" : "✅"}
              </span>
              <p className="text-base font-bold text-gray-800 mb-1">
                {permit.status === "작업중지"
                  ? "작업중지된 허가서입니다"
                  : "이미 승인 완료된 허가서입니다"}
              </p>
              <p className="text-sm text-gray-500">관리자에게 문의하세요.</p>
            </div>
          ) : (
            <WorkPermitApprovalFlow
              approvalToken={approvalToken}
              approverRole={approval.approver_role}
              roleLabel={roleLabel}
              permit={{
                grade: permit.grade,
                permit_type: permit.permit_type,
                work_name: permit.work_name,
                work_location: permit.work_location,
                work_period_start: permit.work_period_start,
                work_period_end: permit.work_period_end,
              }}
            />
          )}

          <p className="text-xs text-gray-300 text-center mt-8">
            주식회사 원엔지니어링 · 작업허가서 전자승인 시스템
          </p>
        </div>
      </main>
    </div>
  );
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <p className="text-sm font-bold text-gray-900">주식회사 원엔지니어링</p>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center max-w-sm w-full">
          <span className="text-4xl block mb-4">⚠️</span>
          <p className="text-base font-bold text-gray-800 mb-2">
            유효하지 않거나 만료된 승인 링크입니다
          </p>
          <p className="text-sm text-gray-500">관리자에게 문의하세요.</p>
        </div>
      </main>
    </div>
  );
}
