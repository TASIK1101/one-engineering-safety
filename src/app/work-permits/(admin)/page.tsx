export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { WorkPermit } from "@/types";
import { WorkPermitStatusBadge, WorkPermitGradeBadge } from "@/components/work-permit/WorkPermitStatusBadge";

export default async function WorkPermitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: permits } = await supabase
    .from("work_permits")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (permits ?? []) as WorkPermit[];

  const totalCount = list.length;
  const activeCount = list.filter(
    (p) => p.status === "서명중" || p.status === "검토중"
  ).length;
  const approvedCount = list.filter((p) => p.status === "승인완료").length;
  const stoppedCount = list.filter((p) => p.status === "작업중지").length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">작업허가서</h1>
          <p className="text-sm text-gray-500 mt-1">
            A/B급 작업허가서를 발행하고 작업자 서명을 관리합니다
          </p>
        </div>
        <Link
          href="/work-permits/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
        >
          + 새 허가서 작성
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <SummaryCard label="전체" value={totalCount} color="blue" />
        <SummaryCard label="진행중" value={activeCount} color="amber" />
        <SummaryCard label="승인완료" value={approvedCount} color="green" />
        <SummaryCard label="작업중지" value={stoppedCount} color="red" />
      </div>

      {/* 목록 */}
      {list.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-14 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold text-gray-700 mb-1">작업허가서가 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">
            A/B급 작업허가서를 작성하고 작업자 서명을 관리하세요.
          </p>
          <Link
            href="/work-permits/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            + 새 허가서 작성
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((permit) => (
            <PermitCard key={permit.id} permit={permit} />
          ))}
        </div>
      )}
    </div>
  );
}

function PermitCard({ permit }: { permit: WorkPermit }) {
  const startDate = permit.work_period_start
    ? new Date(permit.work_period_start).toLocaleDateString("ko-KR", {
        month: "2-digit", day: "2-digit",
      })
    : null;
  const endDate = permit.work_period_end
    ? new Date(permit.work_period_end).toLocaleDateString("ko-KR", {
        month: "2-digit", day: "2-digit",
      })
    : null;

  return (
    <Link
      href={`/work-permits/${permit.id}`}
      className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <WorkPermitGradeBadge grade={permit.grade} />
            <WorkPermitStatusBadge status={permit.status} />
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              {permit.permit_type}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-base">
            {permit.work_name || permit.title}
          </p>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
            {permit.work_location && (
              <span>📍 {permit.work_location}</span>
            )}
            {permit.work_company && (
              <span>🏢 {permit.work_company}</span>
            )}
            {startDate && (
              <span>
                📅 {startDate}{endDate && endDate !== startDate ? ` ~ ${endDate}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">
            {new Date(permit.created_at).toLocaleDateString("ko-KR")}
          </p>
          <p className="text-xs text-blue-600 font-medium mt-1">상세 보기 →</p>
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "amber" | "green" | "red";
}) {
  const borderColors = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    green: "border-l-green-500",
    red: "border-l-red-500",
  };
  const textColors = {
    blue: "text-blue-600",
    amber: "text-amber-600",
    green: "text-green-600",
    red: "text-red-600",
  };
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 border-l-4 ${borderColors[color]} p-4 shadow-sm`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${textColors[color]}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">건</span>
      </p>
    </div>
  );
}
