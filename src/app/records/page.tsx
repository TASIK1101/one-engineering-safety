export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import UnifiedRecordsFilter from "./RecordsFilter";

// ── 정규화된 통합 레코드 타입 ─────────────────────────────────
type RecordType = "tbm" | "inspection" | "corrective";

type UnifiedRecord = {
  type: RecordType;
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  area: string;
  workType: string;
  status: string;
  author: string;
  detailHref: string;
  printHref: string;
};

// ── 타입 배지 ─────────────────────────────────────────────────
function TypeBadge({ type }: { type: RecordType }) {
  const map = {
    tbm:         { label: "TBM",  cls: "bg-blue-800 text-white" },
    inspection:  { label: "점검", cls: "bg-indigo-600 text-white" },
    corrective:  { label: "시정", cls: "bg-orange-500 text-white" },
  };
  const { label, cls } = map[type];
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── 상태 배지 ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    작성중: "bg-gray-100 text-gray-600 border-gray-200",
    서명중: "bg-blue-50 text-blue-700 border-blue-200",
    검토중: "bg-amber-50 text-amber-700 border-amber-200",
    완료:   "bg-green-50 text-green-700 border-green-200",
    반려:   "bg-red-50 text-red-700 border-red-200",
    대기:   "bg-gray-100 text-gray-500 border-gray-200",
    조치중: "bg-blue-50 text-blue-600 border-blue-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default async function UnifiedRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    q?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filterType = params.type ?? "";      // 'tbm' | 'inspection' | 'corrective' | ''
  const filterQ    = params.q ?? "";
  const dateFrom   = params.date_from ?? "";
  const dateTo     = params.date_to ?? "";
  const filterStatus = params.status ?? "";

  // ── 병렬 조회 ─────────────────────────────────────────────
  const [tbmRes, insRes, caRes] = await Promise.all([
    filterType && filterType !== "tbm" ? Promise.resolve({ data: [] }) :
      supabase.from("tbm_records")
        .select("id,date,worksite_location,work_type,process_name,supervisor,status")
        .eq("admin_id", user!.id)
        .order("date", { ascending: false })
        .limit(200),

    filterType && filterType !== "inspection" ? Promise.resolve({ data: [] }) :
      supabase.from("safety_inspections")
        .select("id,inspection_date,inspection_area,inspector_name,status")
        .eq("admin_id", user!.id)
        .order("inspection_date", { ascending: false })
        .limit(200),

    filterType && filterType !== "corrective" ? Promise.resolve({ data: [] }) :
      supabase.from("corrective_actions")
        .select("id,issue_title,assigned_to,due_date,status,created_at")
        .eq("admin_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200),
  ]);

  // ── 정규화 ────────────────────────────────────────────────
  const tbmRows: UnifiedRecord[] = (tbmRes.data ?? []).map((r) => ({
    type: "tbm",
    id: r.id,
    date: r.date,
    title: r.work_type + (r.process_name ? ` · ${r.process_name}` : ""),
    area: r.worksite_location ?? "-",
    workType: r.work_type,
    status: r.status,
    author: r.supervisor ?? "-",
    detailHref: `/tbm/${r.id}`,
    printHref:  `/records/tbm/${r.id}`,
  }));

  const insRows: UnifiedRecord[] = (insRes.data ?? []).map((r) => ({
    type: "inspection",
    id: r.id,
    date: r.inspection_date,
    title: r.inspection_area,
    area: r.inspection_area,
    workType: "-",
    status: r.status,
    author: r.inspector_name ?? "-",
    detailHref: `/inspections/${r.id}`,
    printHref:  `/records/inspection/${r.id}`,
  }));

  const caRows: UnifiedRecord[] = (caRes.data ?? []).map((r) => ({
    type: "corrective",
    id: r.id,
    date: (r.created_at as string).substring(0, 10),
    title: r.issue_title,
    area: "-",
    workType: "-",
    status: r.status,
    author: r.assigned_to ?? "-",
    detailHref: `/corrective-actions/${r.id}`,
    printHref:  `/records/corrective-action/${r.id}`,
  }));

  // ── 병합 + 날짜 정렬 ────────────────────────────────────────
  let merged = [...tbmRows, ...insRows, ...caRows].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  // ── 클라이언트 필터 (URL params 기반) ─────────────────────
  if (dateFrom) merged = merged.filter((r) => r.date >= dateFrom);
  if (dateTo)   merged = merged.filter((r) => r.date <= dateTo);
  if (filterStatus) merged = merged.filter((r) => r.status === filterStatus);
  if (filterQ) {
    const q = filterQ.toLowerCase();
    merged = merged.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.workType.toLowerCase().includes(q)
    );
  }

  // ── 통계 ─────────────────────────────────────────────────
  const totalTbm    = tbmRows.length;
  const totalIns    = insRows.length;
  const totalCa     = caRows.length;
  const unresolved  = merged.filter((r) => !["완료"].includes(r.status)).length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통합 기록 보관함</h1>
          <p className="text-sm text-gray-500 mt-1">
            TBM · 안전점검 · 시정조치 기록을 검색하고 출력합니다.
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TBM",    value: totalTbm,   color: "border-l-blue-500 text-blue-700" },
          { label: "안전점검", value: totalIns, color: "border-l-indigo-500 text-indigo-700" },
          { label: "시정조치", value: totalCa,  color: "border-l-orange-500 text-orange-700" },
          { label: "미결 항목", value: unresolved, color: "border-l-red-400 text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl bg-white border border-gray-200 border-l-4 ${color.split(" ")[0]} p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className={`text-2xl font-bold ${color.split(" ")[1]}`}>
              {value}<span className="text-sm font-normal text-gray-400 ml-1">건</span>
            </p>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <Suspense fallback={<div className="h-24 rounded-xl bg-white border border-gray-200 animate-pulse mb-4" />}>
        <UnifiedRecordsFilter />
      </Suspense>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-3 mt-4">
        검색 결과 <strong className="text-gray-800">{merged.length}</strong>건
        {(filterQ || filterType || filterStatus || dateFrom || dateTo) && (
          <Link href="/records" className="ml-2 text-blue-600 text-xs hover:underline">
            필터 초기화
          </Link>
        )}
      </p>

      {/* 목록 */}
      {merged.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-gray-500 font-medium">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">필터를 변경하거나 초기화해 보세요.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {/* 데스크탑 테이블 헤더 */}
          <div className="hidden sm:grid grid-cols-[72px_90px_1fr_80px_90px_90px_130px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>유형</span>
            <span>날짜</span>
            <span>제목 / 구역</span>
            <span>공종</span>
            <span>상태</span>
            <span>작성/담당</span>
            <span className="text-right">액션</span>
          </div>

          <div className="divide-y divide-gray-100">
            {merged.map((r) => (
              <div key={`${r.type}-${r.id}`}
                className="grid grid-cols-1 sm:grid-cols-[72px_90px_1fr_80px_90px_90px_130px] gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* 유형 */}
                <div className="flex items-center">
                  <TypeBadge type={r.type} />
                </div>

                {/* 날짜 */}
                <div className="flex items-center text-sm text-gray-600 font-medium">
                  {r.date}
                </div>

                {/* 제목 */}
                <div className="flex items-center min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {r.title}
                  </span>
                  {r.area !== "-" && r.area !== r.title && (
                    <span className="ml-2 text-xs text-gray-400 hidden lg:inline truncate">
                      {r.area}
                    </span>
                  )}
                </div>

                {/* 공종 */}
                <div className="flex items-center text-xs text-gray-500">
                  {r.workType}
                </div>

                {/* 상태 */}
                <div className="flex items-center">
                  <StatusBadge status={r.status} />
                </div>

                {/* 작성/담당 */}
                <div className="flex items-center text-xs text-gray-500 truncate">
                  {r.author}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={r.detailHref}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    상세보기
                  </Link>
                  <Link
                    href={r.printHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    🖨️ 인쇄
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
