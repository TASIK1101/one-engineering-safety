"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkPermit, WorkPermitItem } from "@/types";

interface ChecklistRow {
  id: string;
  apply_status: "신청" | "해당없음";
  item_text: string;
  category: string;
}

interface Props {
  permit: WorkPermit;
  checklistItems: WorkPermitItem[];
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function WorkPermitResubmitForm({ permit, checklistItems }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [workName, setWorkName] = useState(permit.work_name ?? "");
  const [workLocation, setWorkLocation] = useState(permit.work_location ?? "");
  const [workPeriodStart, setWorkPeriodStart] = useState(permit.work_period_start ?? "");
  const [workPeriodEnd, setWorkPeriodEnd] = useState(permit.work_period_end ?? "");
  const [workerCount, setWorkerCount] = useState(permit.worker_count?.toString() ?? "");
  const [supervisorName, setSupervisorName] = useState(permit.supervisor_name ?? "");
  const [emergencyContact, setEmergencyContact] = useState(permit.emergency_contact ?? "");
  const [rows, setRows] = useState<ChecklistRow[]>(
    checklistItems.map((i) => ({
      id: i.id,
      apply_status: i.apply_status,
      item_text: i.item_text,
      category: i.category,
    }))
  );

  function toggleItem(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, apply_status: r.apply_status === "신청" ? "해당없음" : "신청" }
          : r
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/resubmit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permitId: permit.id,
        work_name: workName || null,
        work_location: workLocation || null,
        work_period_start: workPeriodStart || null,
        work_period_end: workPeriodEnd || null,
        worker_count: workerCount ? parseInt(workerCount) : null,
        supervisor_name: supervisorName || null,
        emergency_contact: emergencyContact || null,
        items: rows.map((r) => ({ id: r.id, apply_status: r.apply_status })),
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "재제출 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setEditing(true)}
          className="w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
        >
          ✏️ 수정 후 재제출
        </button>
      </div>
    );
  }

  // 카테고리별 그룹
  const grouped: Record<string, ChecklistRow[]> = {};
  for (const r of rows) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-blue-100 pt-5 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm font-semibold text-blue-700">✏️ 반려 내용 수정 후 재제출</p>

      {/* 수정 가능 필드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">작업명</label>
          <input
            type="text"
            value={workName}
            onChange={(e) => setWorkName(e.target.value)}
            placeholder="작업명"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">작업장소</label>
          <input
            type="text"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            placeholder="작업장소"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">작업 시작일</label>
          <input
            type="date"
            value={workPeriodStart}
            onChange={(e) => setWorkPeriodStart(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">작업 종료일</label>
          <input
            type="date"
            value={workPeriodEnd}
            onChange={(e) => setWorkPeriodEnd(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">작업인원</label>
          <input
            type="number"
            min={1}
            value={workerCount}
            onChange={(e) => setWorkerCount(e.target.value)}
            placeholder="3"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">관리감독자</label>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder="홍길동"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">비상연락망</label>
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="010-0000-0000 (안전팀)"
            className={inputCls}
          />
        </div>
      </div>

      {/* 체크리스트 */}
      {rows.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">체크리스트</p>
          <div className="space-y-3">
            {Object.entries(grouped).map(([category, catRows]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg mb-1.5">
                  {category}
                </p>
                <div className="space-y-1">
                  {catRows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`flex-1 text-sm ${
                          r.apply_status === "해당없음"
                            ? "text-gray-400 line-through"
                            : "text-gray-800"
                        }`}
                      >
                        {r.item_text}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleItem(r.id)}
                        className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                          r.apply_status === "신청"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-100 text-gray-500 border-gray-300"
                        }`}
                      >
                        {r.apply_status}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-5 py-2.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-colors"
        >
          {loading ? "제출 중…" : "검토 요청 →"}
        </button>
      </div>
    </form>
  );
}
