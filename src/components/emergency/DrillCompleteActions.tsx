"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DRILL_RESULT_STATUSES } from "@/lib/emergency";
import type { EmergencyDrill } from "@/types";

export default function DrillCompleteActions({ drill }: { drill: EmergencyDrill }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(drill.result_status);
  const [approver, setApprover] = useState(drill.approved_by ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function save() {
    setError("");
    setDone(false);
    setLoading(true);
    const body: Record<string, unknown> = { result_status: status };
    if (status === "완료") {
      if (!approver.trim()) {
        setLoading(false);
        setError("완료 처리 시 승인자 이름이 필요합니다.");
        return;
      }
      body.approved_by = approver.trim();
      body.approved_at = new Date().toISOString();
    }
    const res = await fetch(`/api/emergency/drills/${drill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(`처리 실패: ${d.detail ?? d.error ?? "오류"}`);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-3">상태 / 승인 처리</h2>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}
      {done && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">저장되었습니다.</p>}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {DRILL_RESULT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {status === "완료" && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">승인자 이름 *</label>
            <input value={approver} onChange={(e) => setApprover(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
        <button onClick={save} disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
          {loading ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
