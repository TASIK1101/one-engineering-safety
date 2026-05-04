"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { TRAINING_TYPE_OPTIONS } from "@/lib/training-types";

function RecordsFilterInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [instructor, setInstructor] = useState(sp.get("instructor") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (instructor) params.set("instructor", instructor);
    startTransition(() => {
      router.push(`/records?${params.toString()}`);
    });
  }

  function reset() {
    setQ("");
    setType("");
    setStatus("");
    setInstructor("");
    startTransition(() => {
      router.push("/records");
    });
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            교육명 / 작업명 검색
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="검색어 입력"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">교육 유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">전체 유형</option>
            {TRAINING_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">이수 상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="completed">전원 이수 완료</option>
            <option value="pending">미이수자 있음</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">교육 담당자</label>
          <input
            type="text"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="담당자 이름"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

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

export default function RecordsFilter() {
  return (
    <Suspense>
      <RecordsFilterInner />
    </Suspense>
  );
}
