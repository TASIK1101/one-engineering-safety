"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";

const TYPE_OPTIONS = [
  { value: "",             label: "전체" },
  { value: "tbm",          label: "TBM" },
  { value: "inspection",   label: "안전점검" },
  { value: "corrective",   label: "시정조치" },
  { value: "work-permit",  label: "작업허가서" },
  { value: "ppe",          label: "보호구 지급" },
];

const STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "": [
    { value: "서명중",   label: "서명중" },
    { value: "검토중",   label: "검토중" },
    { value: "완료",     label: "완료" },
    { value: "승인완료", label: "승인완료" },
    { value: "반려",     label: "반려" },
    { value: "대기",     label: "대기" },
    { value: "조치중",   label: "조치중" },
    { value: "작업중지", label: "작업중지" },
    { value: "지급중",   label: "지급중" },
    { value: "반납완료", label: "반납완료" },
    { value: "교체완료", label: "교체완료" },
    { value: "분실",     label: "분실" },
    { value: "폐기",     label: "폐기" },
  ],
  tbm: [
    { value: "서명중", label: "서명중" },
    { value: "검토중", label: "검토중" },
    { value: "완료",   label: "완료" },
    { value: "반려",   label: "반려" },
  ],
  inspection: [
    { value: "작성중", label: "작성중" },
    { value: "완료",   label: "완료" },
  ],
  corrective: [
    { value: "대기",   label: "대기" },
    { value: "조치중", label: "조치중" },
    { value: "검토중", label: "검토중" },
    { value: "완료",   label: "완료" },
    { value: "반려",   label: "반려" },
  ],
  "work-permit": [
    { value: "작성중",   label: "작성중" },
    { value: "서명중",   label: "서명중" },
    { value: "검토중",   label: "검토중" },
    { value: "승인완료", label: "승인완료" },
    { value: "반려",     label: "반려" },
    { value: "작업중지", label: "작업중지" },
  ],
  ppe: [
    { value: "지급중",   label: "지급중" },
    { value: "반납완료", label: "반납완료" },
    { value: "교체완료", label: "교체완료" },
    { value: "분실",     label: "분실" },
    { value: "폐기",     label: "폐기" },
  ],
};

function UnifiedRecordsFilterInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [type,      setType]      = useState(sp.get("type")      ?? "");
  const [q,         setQ]         = useState(sp.get("q")         ?? "");
  const [dateFrom,  setDateFrom]  = useState(sp.get("date_from") ?? "");
  const [dateTo,    setDateTo]    = useState(sp.get("date_to")   ?? "");
  const [status,    setStatus]    = useState(sp.get("status")    ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (type)     params.set("type",      type);
    if (q)        params.set("q",         q);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo)   params.set("date_to",   dateTo);
    if (status)   params.set("status",    status);
    startTransition(() => router.push(`/records?${params.toString()}`));
  }

  function reset() {
    setType(""); setQ(""); setDateFrom(""); setDateTo(""); setStatus("");
    startTransition(() => router.push("/records"));
  }

  const statusOptions = STATUS_OPTIONS[type] ?? STATUS_OPTIONS[""];

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm mb-4">
      {/* 유형 탭 */}
      <div className="flex gap-1.5 mb-4">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setType(opt.value); setStatus(""); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              type === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 상세 필터 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 검색어 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">검색어</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="제목, 구역, 담당자 검색"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 날짜 시작 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">날짜 (시작)</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 날짜 종료 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">날짜 (종료)</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 상태 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={apply}
          disabled={isPending}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "검색 중..." : "검색"}
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  );
}

export default function UnifiedRecordsFilter() {
  return (
    <Suspense fallback={<div className="h-28 rounded-xl bg-white border border-gray-200 animate-pulse" />}>
      <UnifiedRecordsFilterInner />
    </Suspense>
  );
}
