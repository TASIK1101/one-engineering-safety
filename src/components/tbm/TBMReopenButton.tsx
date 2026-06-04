"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TBMReopenButton({ tbmId }: { tbmId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  async function handleReopen() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tbm/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tbmId }),
      });
      if (!res.ok) {
        setError("승인 무효화 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류. 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs font-medium text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors"
      >
        수정을 위해 승인 무효화
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="text-amber-800 mb-2 font-medium">
        기존 전자확인(서명)이 모두 무효화되고 재승인이 필요합니다. 진행할까요?
      </p>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-white"
        >
          취소
        </button>
        <button
          onClick={handleReopen}
          disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 rounded-lg"
        >
          {loading ? "처리 중..." : "무효화 진행"}
        </button>
      </div>
    </div>
  );
}
