export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { CorrectiveAction, SafetyInspectionItem, SafetyInspection } from "@/types";
import { getCorrectiveActionStatusColor } from "@/lib/inspection-categories";
import CorrectiveActionUpdateForm from "@/components/inspection/CorrectiveActionUpdateForm";
import CorrectiveActionApproveBox from "@/components/inspection/CorrectiveActionApproveBox";
import SafeImg from "@/components/ui/SafeImg";

export default async function CorrectiveActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: actionData } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("id", id)
    .single();

  if (!actionData || actionData.admin_id !== user!.id) notFound();

  const action = actionData as CorrectiveAction;

  // Fetch linked inspection item context if available
  let inspectionItem: SafetyInspectionItem | null = null;
  let linkedInspection: SafetyInspection | null = null;

  if (action.inspection_item_id) {
    const { data: itemData } = await supabase
      .from("safety_inspection_items")
      .select("*")
      .eq("id", action.inspection_item_id)
      .single();
    if (itemData) {
      inspectionItem = itemData as SafetyInspectionItem;
    }
  }

  if (action.inspection_id) {
    const { data: inspData } = await supabase
      .from("safety_inspections")
      .select("*")
      .eq("id", action.inspection_id)
      .single();
    if (inspData) {
      linkedInspection = inspData as SafetyInspection;
    }
  }

  const canUpdate = ["대기", "조치중", "반려"].includes(action.status);
  const canApprove = action.status === "검토중";
  const isCompleted = action.status === "완료";

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 pb-5 border-b border-gray-200">
        <div className="mb-2">
          <Link
            href="/corrective-actions"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← 시정조치 목록
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${getCorrectiveActionStatusColor(action.status)}`}
          >
            {action.status}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{action.issue_title}</h1>
      </div>

      {/* 반려 사유 */}
      {action.status === "반려" && action.rejection_reason && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">⚠️ 반려 사유</p>
          <p className="text-sm text-red-600">{action.rejection_reason}</p>
        </div>
      )}

      {/* 이슈 정보 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          불량 내용
        </h2>
        {action.issue_description && (
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap mb-4">
            {action.issue_description}
          </p>
        )}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold">현황 사진 (Before)</p>
          <SafeImg
            src={action.before_photo_url}
            alt="현황 사진"
            className="max-w-xs rounded-lg border border-gray-200"
          />
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-4">
          {action.assigned_to && (
            <div>
              <dt className="text-xs text-gray-500 mb-0.5">담당자</dt>
              <dd className="font-medium text-gray-900">{action.assigned_to}</dd>
            </div>
          )}
          {action.due_date && (
            <div>
              <dt className="text-xs text-gray-500 mb-0.5">조치 기한</dt>
              <dd className="font-medium text-gray-900">{action.due_date}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* 출처 점검 정보 */}
      {linkedInspection && (
        <section className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            출처 점검
          </h2>
          <p className="text-sm text-gray-700">
            출처:{" "}
            <Link
              href={`/inspections/${linkedInspection.id}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {linkedInspection.inspection_date} {linkedInspection.inspection_area} 점검
            </Link>
            {inspectionItem && (
              <span className="text-gray-500"> — {inspectionItem.item_text}</span>
            )}
          </p>
        </section>
      )}

      {/* 조치 결과 입력 폼 (대기, 조치중, 반려) */}
      {canUpdate && (
        <CorrectiveActionUpdateForm
          actionId={id}
          currentStatus={action.status}
          rejectionReason={action.rejection_reason}
        />
      )}

      {/* 승인/반려 박스 (검토중) */}
      {canApprove && <CorrectiveActionApproveBox actionId={id} />}

      {/* 완료 정보 */}
      {isCompleted && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            ✅ 완료 정보
          </h2>
          {action.action_result && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1 font-semibold">조치 결과</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {action.action_result}
              </p>
            </div>
          )}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-semibold">조치 후 사진 (After)</p>
            <SafeImg
              src={action.after_photo_url}
              alt="조치 후 사진"
              className="max-w-xs rounded-lg border border-gray-200"
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
            {action.approved_by && (
              <div>
                <dt className="text-xs text-gray-500 mb-0.5">승인자</dt>
                <dd className="font-medium text-gray-900">{action.approved_by}</dd>
              </div>
            )}
            {action.approved_at && (
              <div>
                <dt className="text-xs text-gray-500 mb-0.5">승인일시</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(action.approved_at).toLocaleString("ko-KR")}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
