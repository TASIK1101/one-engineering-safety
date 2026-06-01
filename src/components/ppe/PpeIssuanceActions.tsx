"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActionType = "반납" | "교체" | "분실" | "폐기";

const ACTIONS: { key: ActionType; label: string; cls: string }[] = [
  { key: "반납", label: "반납", cls: "text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200" },
  { key: "교체", label: "교체", cls: "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200" },
  { key: "분실", label: "분실", cls: "text-red-700 bg-red-50 hover:bg-red-100 border-red-200" },
  { key: "폐기", label: "폐기", cls: "text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300" },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PpeIssuanceActions({ issuanceId }: { issuanceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<ActionType | null>(null);
  const [actionDate, setActionDate] = useState(todayStr());
  const [actorName, setActorName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal(action: ActionType) {
    setActionDate(todayStr());
    setActorName("");
    setNote("");
    setError("");
    setOpen(action);
  }

  async function submit() {
    if (!open) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/ppe/issuances/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issuanceId,
        action: open,
        actionDate,
        actorName: actorName.trim() || undefined,
        note: note.trim() || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(`처리 실패: ${d.detail ?? d.error ?? "오류"}`);
      return;
    }
    setOpen(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => openModal(a.key)}
            className={`px-2.5 py-1 text-xs font-semibold border rounded-lg transition-colors ${a.cls}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">보호구 {open} 처리</h3>

              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {open}일
              </label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-xs font-semibold text-gray-600 mb-1">처리 담당자 (선택)</label>
              <input
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="담당자 이름"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-xs font-semibold text-gray-600 mb-1">비고 (선택)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={open === "교체" ? "교체 시 동일 품목으로 새 지급이 자동 생성됩니다." : ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {open === "교체" && (
                <p className="text-xs text-amber-600 mb-3">
                  ※ 교체 처리 시 동일 직원·품목으로 신규 지급이 자동 생성됩니다.
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl"
                >
                  {loading ? "처리 중…" : `${open} 확정`}
                </button>
                <button
                  onClick={() => setOpen(null)}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
