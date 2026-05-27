"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConfinedSpaceEntryLog } from "@/types";

interface Props {
  permitId: string;
  logs: ConfinedSpaceEntryLog[];
  isLocked: boolean;
}

function fmtTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConfinedSpaceEntryLogBox({ permitId, logs, isLocked }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    worker_name: "",
    entry_time: "",
    exit_time: "",
    note: "",
  });

  function onChange(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.worker_name.trim()) {
      setError("작업자명을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/entry-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permitId,
        worker_name: form.worker_name,
        entry_time: form.entry_time
          ? new Date(form.entry_time).toISOString()
          : null,
        exit_time: form.exit_time
          ? new Date(form.exit_time).toISOString()
          : null,
        note: form.note || null,
      }),
    });

    if (!res.ok) {
      setError("저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    setForm({ worker_name: "", entry_time: "", exit_time: "", note: "" });
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(logId: string) {
    if (!confirm("이 출입 기록을 삭제하시겠습니까?")) return;
    const res = await fetch("/api/work-permits/entry-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-xl bg-white border border-orange-100 p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">🚪 밀폐구역 출입 관리대장</h2>
        {!isLocked && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs text-orange-600 hover:text-orange-800 border border-orange-200 rounded-lg px-3 py-1 hover:bg-orange-50 transition-colors"
          >
            {showForm ? "닫기" : "+ 출입 기록 추가"}
          </button>
        )}
      </div>

      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600">
                  No
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600">
                  작업자명
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600">
                  입실 시간
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600">
                  퇴실 시간
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600">
                  비고
                </th>
                {!isLocked && (
                  <th className="border border-gray-200 px-2 py-1.5 w-8" />
                )}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 font-medium text-gray-900">
                    {log.worker_name}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600">
                    {fmtTime(log.entry_time)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600">
                    {fmtTime(log.exit_time)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-500">
                    {log.note ?? "-"}
                  </td>
                  {!isLocked && (
                    <td className="border border-gray-200 px-2 py-1.5 text-center">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">출입 기록이 없습니다.</p>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mt-4 border-t border-gray-100 pt-4 space-y-3"
        >
          <p className="text-xs font-semibold text-gray-600">새 출입 기록 추가</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">작업자명 *</label>
              <input
                type="text"
                required
                value={form.worker_name}
                onChange={(e) => onChange("worker_name", e.target.value)}
                placeholder="홍길동"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">비고</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => onChange("note", e.target.value)}
                placeholder="특이사항"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">입실 시간</label>
              <input
                type="datetime-local"
                value={form.entry_time}
                onChange={(e) => onChange("entry_time", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">퇴실 시간</label>
              <input
                type="datetime-local"
                value={form.exit_time}
                onChange={(e) => onChange("exit_time", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {loading ? "저장 중…" : "추가"}
          </button>
        </form>
      )}
    </section>
  );
}
