"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { WORK_TYPES } from "@/lib/tbm-work-types";

const STATUSES = ["작성중", "서명중", "검토중", "완료", "반려"];

export default function TBMRecordsFilter() {
  const sp = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [workType, setWorkType] = useState(sp.get("work_type") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [dateFrom, setDateFrom] = useState(sp.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(sp.get("date_to") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (workType) params.set("work_type", workType);
    if (status) params.set("status", status);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    router.push(`/tbm/records?${params.toString()}`);
  }

  function reset() {
    setQ("");
    setWorkType("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    router.push("/tbm/records");
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          placeholder="공종, 공정명, 위치, 담당자..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 공종</option>
          {WORK_TYPES.map((wt) => (
            <option key={wt.value} value={wt.value}>
              {wt.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 상태</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={apply} className="flex-1 sm:flex-none">
          검색
        </Button>
        <Button variant="secondary" onClick={reset}>
          초기화
        </Button>
      </div>
    </div>
  );
}
