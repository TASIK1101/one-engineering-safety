export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import LogoMark from "@/components/ui/LogoMark";
import TBMApprovalFlow from "@/components/tbm/TBMApprovalFlow";
import type { TbmRecord, TbmApproval } from "@/types";

export default async function TbmPublicApprovePage({
  params,
}: {
  params: Promise<{ approvalToken: string }>;
}) {
  const { approvalToken } = await params;

  // 공개 페이지지만 service role(admin) 클라이언트로 토큰 1건만 조회
  // (전체 직원/승인 목록 노출 없음)
  const admin = createAdminClient();

  const { data: approvalData } = await admin
    .from("tbm_approvals")
    .select("id, tbm_record_id, approver_role, approver_name, approval_status, approved_at")
    .eq("approval_token", approvalToken)
    .single();

  if (!approvalData) notFound();
  const approval = approvalData as Pick<
    TbmApproval,
    "id" | "tbm_record_id" | "approver_role" | "approver_name" | "approval_status" | "approved_at"
  >;

  const { data: recordData } = await admin
    .from("tbm_records")
    .select(
      "id, date, work_type, process_name, worksite_location, supervisor, hazard_items, main_hazard_notes"
    )
    .eq("id", approval.tbm_record_id)
    .single();

  if (!recordData) notFound();
  const tbm = recordData as Pick<
    TbmRecord,
    | "id"
    | "date"
    | "work_type"
    | "process_name"
    | "worksite_location"
    | "supervisor"
    | "hazard_items"
    | "main_hazard_notes"
  >;

  const roleLabel = approval.approver_role === "안전전담자" ? "TBM 실시·확인자 (안전전담자)" : "소장 / 대표";
  const alreadyDone = approval.approval_status === "승인" || approval.approval_status === "반려";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              주식회사 원엔지니어링 · TBM 전자확인
            </p>
            <p className="text-sm font-bold text-gray-900">
              {tbm.date} {tbm.work_type} TBM
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* 역할 안내 */}
          <div className="mb-4 rounded-2xl bg-blue-600 px-5 py-4 text-white shadow-sm">
            <p className="text-xs text-blue-100">전자확인 요청 역할</p>
            <p className="text-lg font-bold">{roleLabel}</p>
            {approval.approver_name && (
              <p className="text-sm text-blue-100 mt-0.5">{approval.approver_name} 님</p>
            )}
          </div>

          {alreadyDone ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">
                {approval.approval_status === "승인" ? "✅" : "⛔"}
              </span>
              <p className="text-base font-bold text-gray-800 mb-1">
                {approval.approval_status === "승인"
                  ? "이미 전자확인이 완료되었습니다"
                  : "반려 처리된 TBM입니다"}
              </p>
              <p className="text-sm text-gray-500">
                {approval.approved_at
                  ? new Date(approval.approved_at).toLocaleString("ko-KR")
                  : ""}
                <br />
                관리자에게 문의하세요.
              </p>
            </div>
          ) : (
            <TBMApprovalFlow
              approvalToken={approvalToken}
              roleLabel={roleLabel}
              tbm={tbm}
            />
          )}

          <p className="text-xs text-gray-300 text-center mt-8">
            주식회사 원엔지니어링 · TBM 전자확인 시스템
          </p>
        </div>
      </main>
    </div>
  );
}
