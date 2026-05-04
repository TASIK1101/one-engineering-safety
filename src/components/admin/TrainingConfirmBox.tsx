"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  trainingId: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  confirmationMemo: string | null;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrainingConfirmBox({
  trainingId,
  confirmedAt,
  confirmedBy,
  confirmationMemo,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(confirmedBy ?? "");
  const [memo, setMemo] = useState(confirmationMemo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfirmed = !!confirmedAt;

  async function handleConfirm() {
    if (!name.trim()) {
      setError("담당자명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/confirm-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainingId,
        confirmedBy: name,
        confirmationMemo: memo,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm mb-5">
      <h2 className="font-semibold text-gray-800 mb-3">교육 담당자 확인</h2>

      {isConfirmed && !editing ? (
        <div className="flex flex-col gap-2 text-sm mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
              ✓ 확인 완료
            </span>
            <span className="text-gray-500 text-xs">
              {formatDateTime(confirmedAt)}
            </span>
          </div>
          <div className="text-gray-700">
            <span className="text-gray-400">담당자: </span>
            <strong>{confirmedBy}</strong>
          </div>
          {confirmationMemo && (
            <div className="text-gray-600 bg-gray-50 rounded-lg px-3 py-2 text-xs whitespace-pre-wrap">
              {confirmationMemo}
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-1 text-xs text-blue-600 hover:underline text-left"
          >
            수정
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!isConfirmed && (
            <p className="text-xs text-gray-400">
              교육 담당자가 직접 확인 후 기록해주세요. 출력 문서에 담당자 확인
              정보가 포함됩니다.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              교육 담당자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 안전관리자 홍길동"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              확인 메모 (선택)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="특이사항이나 확인 내용을 입력하세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "저장 중..." : "교육 담당자 확인 완료"}
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setName(confirmedBy ?? "");
                  setMemo(confirmationMemo ?? "");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
