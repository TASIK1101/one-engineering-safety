export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type {
  SafetyInspection,
  SafetyInspectionItem,
  CorrectiveAction,
} from "@/types";
import {
  getConditionColor,
  getCorrectiveActionStatusColor,
} from "@/lib/inspection-categories";

export default async function InspectionDetailPage({
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
    .from("safety_inspections")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const [{ data: itemsData }, { data: actionsData }] = await Promise.all([
    supabase
      .from("safety_inspection_items")
      .select("*")
      .eq("inspection_id", id)
      .order("category")
      .order("item_text"),
    supabase
      .from("corrective_actions")
      .select("*")
      .eq("inspection_id", id)
      .order("created_at"),
  ]);

  const inspection = record as SafetyInspection;
  const items = (itemsData ?? []) as SafetyInspectionItem[];
  const actions = (actionsData ?? []) as CorrectiveAction[];

  const totalItems = items.length;
  const goodCount = items.filter((i) => i.condition_status === "양호").length;
  const fairCount = items.filter((i) => i.condition_status === "보통").length;
  const badCount = items.filter((i) => i.condition_status === "불량").length;

  // Group items by category
  const grouped: Record<string, SafetyInspectionItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 pb-5 border-b border-gray-200">
        <div className="mb-2">
          <Link
            href="/inspections"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← 점검 목록
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <InspectionStatusBadge status={inspection.status} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {inspection.inspection_date} 안전점검
          <span className="text-gray-500 font-normal ml-2 text-lg">
            — {inspection.inspection_area}
          </span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          점검자: {inspection.inspector_name}
        </p>
      </div>

      {/* 요약 통계 */}
      <section className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          점검 요약
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            <p className="text-xs text-gray-500 mt-1">전체 항목</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{goodCount}</p>
            <p className="text-xs text-gray-500 mt-1">양호</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{fairCount}</p>
            <p className="text-xs text-gray-500 mt-1">보통</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{badCount}</p>
            <p className="text-xs text-gray-500 mt-1">불량</p>
          </div>
        </div>
      </section>

      {/* 항목 목록 (카테고리별) */}
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section
          key={category}
          className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{category}</span>
            <span className="text-xs font-normal text-gray-400">
              ({categoryItems.length}개 항목)
            </span>
          </h2>
          <div className="space-y-3">
            {categoryItems.map((item) => (
              <div key={item.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-800 flex-1">{item.item_text}</p>
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${getConditionColor(item.condition_status)}`}
                  >
                    {item.condition_status}
                  </span>
                </div>
                {item.condition_status === "불량" && (
                  <div className="mt-2 pl-3 border-l-2 border-red-200">
                    {item.issue_description && (
                      <p className="text-xs text-red-700 mb-1">
                        <span className="font-semibold">불량 내용:</span>{" "}
                        {item.issue_description}
                      </p>
                    )}
                    {item.action_note && (
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">조치 메모:</span>{" "}
                        {item.action_note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* 연계 시정조치 */}
      {actions.length > 0 && (
        <section className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            📋 연계 시정조치
          </h2>
          <div className="space-y-3">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={`/corrective-actions/${action.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {action.issue_title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {action.assigned_to && (
                      <span>담당: {action.assigned_to}</span>
                    )}
                    {action.due_date && <span>기한: {action.due_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${getCorrectiveActionStatusColor(action.status)}`}
                  >
                    {action.status}
                  </span>
                  <span className="text-xs text-blue-600">보기 →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InspectionStatusBadge({ status }: { status: string }) {
  const colorClass =
    status === "완료"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span
      className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${colorClass}`}
    >
      {status}
    </span>
  );
}
