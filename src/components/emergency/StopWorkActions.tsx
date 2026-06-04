"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StopWorkRecord, StopWorkStatus } from "@/types";

// 상태 전이: 작업중지 → 조치중 → 재개승인 → 종료
const NEXT: Record<StopWorkStatus, StopWorkStatus | null> = {
  작업중지: "조치중",
  조치중: "재개승인",
  재개승인: "종료",
  종료: null,
};

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StopWorkActions({ record }: { record: StopWorkRecord }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approveModal, setApproveModal] = useState(false);
  const [approver, setApprover] = useState(record.restart_approved_by ?? "");
  const [approvedAt, setApprovedAt] = useState(nowLocal());
  const [restartNote, setRestartNote] = useState(record.restart_note ?? "");

  const next = NEXT[record.status];

  async function patch(body: Record<string, unknown>) {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/emergency/stop-work/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(`처리 실패: ${d.detail ?? d.error ?? "오류"}`);
      return false;
    }
    setApproveModal(false);
    router.refresh();
    return true;
  }

  async function advance() {
    if (!next) return;
    // 재개승인 단계로 진입할 때는 승인 정보 입력 모달
    if (next === "재개승인") {
      setApproveModal(true);
      return;
    }
    await patch({ status: next });
  }

  async function confirmApprove() {
    if (!approver.trim()) {
      setError("승인자 이름을 입력해주세요.");
      return;
    }
    await patch({
      status: "재개승인",
      restart_approved_by: approver.trim(),
      restart_approved_at: new Date(approvedAt).toISOString(),
      restart_note: restartNote.trim() || null,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-3">상태 처리</h2>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

      <div className="flex items-center gap-2 text-sm mb-4">
        {(["작업중지", "조치중", "재개승인", "종료"] as StopWorkStatus[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${record.status === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s}</span>
          </span>
        ))}
      </div>

      {next ? (
        <button onClick={advance} disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
          {loading ? "처리 중…" : `다음 단계: ${next}`}
        </button>
      ) : (
        <p className="text-sm text-gray-400">종료된 기록입니다.</p>
      )}

      {approveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">작업 재개 승인</h3>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">승인자 이름 *</label>
                <input value={approver} onChange={(e) => setApprover(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">승인 일시</label>
                <input type="datetime-local" value={approvedAt} onChange={(e) => setApprovedAt(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">재개 사유 / 확인 메모</label>
                <textarea value={restartNote} onChange={(e) => setRestartNote(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={confirmApprove} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl">{loading ? "처리 중…" : "재개 승인"}</button>
                <button onClick={() => { setApproveModal(false); setError(""); }} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
