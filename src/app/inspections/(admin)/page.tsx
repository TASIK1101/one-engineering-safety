export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { SafetyInspection, SafetyInspectionItem } from "@/types";

type InspectionWithItems = SafetyInspection & {
  safety_inspection_items: Pick<SafetyInspectionItem, "condition_status">[];
};

export default async function InspectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inspections } = await supabase
    .from("safety_inspections")
    .select("*, safety_inspection_items(condition_status)")
    .eq("admin_id", user!.id)
    .order("inspection_date", { ascending: false })
    .limit(50);

  const list = (inspections ?? []) as InspectionWithItems[];

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalCount = list.length;
  const thisMonthCount = list.filter((r) =>
    r.inspection_date.startsWith(thisMonth)
  ).length;
  const badItemsCount = list.reduce((acc, r) => {
    return (
      acc +
      (r.safety_inspection_items?.filter((i) => i.condition_status === "불량")
        .length ?? 0)
    );
  }, 0);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">안전점검 일지</h1>
          <p className="text-sm text-gray-500 mt-1">
            현장 안전점검 기록을 관리합니다
          </p>
        </div>
        <Link href="/inspections/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-5 py-2.5">
            + 새 점검 작성
          </Button>
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <SummaryCard label="전체" value={totalCount} unit="건" color="blue" />
        <SummaryCard label="이번달" value={thisMonthCount} unit="건" color="indigo" />
        <SummaryCard label="불량항목" value={badItemsCount} unit="건" color="red" />
      </div>

      {/* 점검 목록 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          점검 목록
        </h2>
        {list.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold text-gray-700 mb-1">
              작성된 안전점검이 없습니다
            </p>
            <p className="text-sm text-gray-400 mb-5">
              현장 안전점검을 작성하고 불량 항목을 즉시 시정조치로 등록하세요.
            </p>
            <Link href="/inspections/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                + 새 점검 작성
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((r) => (
              <InspectionCard key={r.id} inspection={r} />
            ))}
          </div>
        )}
      </section>

      {/* 시정조치 링크 */}
      <div className="text-center pt-2">
        <Link
          href="/corrective-actions"
          className="text-sm text-blue-600 hover:underline"
        >
          시정조치 관리 →
        </Link>
      </div>
    </div>
  );
}

// ── 요약 카드 ──────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: "blue" | "indigo" | "red";
}) {
  const colorMap = {
    blue: { border: "border-l-blue-500", text: "text-blue-600" },
    indigo: { border: "border-l-indigo-500", text: "text-indigo-600" },
    red: { border: "border-l-red-500", text: "text-red-600" },
  };
  const { border, text } = colorMap[color];
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 border-l-4 ${border} p-4 shadow-sm`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ── 점검 카드 ──────────────────────────────────────────────────
function InspectionCard({ inspection }: { inspection: InspectionWithItems }) {
  const items = inspection.safety_inspection_items ?? [];
  const totalItems = items.length;
  const badCount = items.filter((i) => i.condition_status === "불량").length;

  return (
    <Link
      href={`/inspections/${inspection.id}`}
      className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <InspectionStatusBadge status={inspection.status} />
        {badCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
            불량 {badCount}건
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-base leading-snug">
            {inspection.inspection_area}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            점검자: {inspection.inspector_name}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">{inspection.inspection_date}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400 mb-0.5">항목</p>
          <p className="text-sm font-semibold">
            {badCount > 0 ? (
              <>
                <span className="text-red-600">{badCount}</span>
                <span className="text-gray-400">/{totalItems}개</span>
              </>
            ) : (
              <span className="text-gray-600">{totalItems}개</span>
            )}
          </p>
        </div>
      </div>
      <p className="text-xs text-blue-600 mt-3 font-medium">상세 보기 →</p>
    </Link>
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
