export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CorrectiveAction } from "@/types";
import { getCorrectiveActionStatusColor } from "@/lib/inspection-categories";

export default async function CorrectiveActionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: actions } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (actions ?? []) as CorrectiveAction[];

  const totalCount = list.length;
  const pendingCount = list.filter((a) =>
    ["대기", "조치중"].includes(a.status)
  ).length;
  const reviewCount = list.filter((a) => a.status === "검토중").length;
  const completedCount = list.filter((a) => a.status === "완료").length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시정조치 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            불량 항목에 대한 조치 결과를 확인하고 승인합니다
          </p>
        </div>
        <Link
          href="/inspections"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 점검 목록
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <SummaryCard label="전체" value={totalCount} color="gray" />
        <SummaryCard label="대기+조치중" value={pendingCount} color="blue" />
        <SummaryCard label="검토중" value={reviewCount} color="amber" />
        <SummaryCard label="완료" value={completedCount} color="green" />
      </div>

      {/* 시정조치 목록 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          시정조치 목록
        </h2>
        {list.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">🔧</div>
            <p className="font-semibold text-gray-700 mb-1">
              등록된 시정조치가 없습니다
            </p>
            <p className="text-sm text-gray-400 mb-5">
              안전점검에서 불량 항목을 등록하면 시정조치가 자동으로 생성됩니다.
            </p>
            <Link
              href="/inspections/new"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + 새 점검 작성
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((action) => (
              <CorrectiveActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── 요약 카드 ──────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "blue" | "amber" | "green";
}) {
  const colorMap = {
    gray: { border: "border-l-gray-400", text: "text-gray-700" },
    blue: { border: "border-l-blue-500", text: "text-blue-600" },
    amber: { border: "border-l-amber-500", text: "text-amber-600" },
    green: { border: "border-l-green-500", text: "text-green-600" },
  };
  const { border, text } = colorMap[color];
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 border-l-4 ${border} p-4 shadow-sm`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${text}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">건</span>
      </p>
    </div>
  );
}

// ── 시정조치 카드 ──────────────────────────────────────────────
function CorrectiveActionCard({ action }: { action: CorrectiveAction }) {
  return (
    <Link
      href={`/corrective-actions/${action.id}`}
      className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${getCorrectiveActionStatusColor(action.status)}`}
            >
              {action.status}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-base leading-snug">
            {action.issue_title}
          </p>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
            {action.assigned_to && (
              <span>담당: {action.assigned_to}</span>
            )}
            {action.due_date && <span>기한: {action.due_date}</span>}
          </div>
        </div>
      </div>
      <p className="text-xs text-blue-600 mt-3 font-medium">상세 보기 →</p>
    </Link>
  );
}
