"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  permitId: string;
  status: string;
}

export default function WorkPermitApproveBox({ permitId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stopReason, setStopReason] = useState("");
  const [showStopForm, setShowStopForm] = useState(false);

  async function callReview() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/work-permits/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permitId, action: "review" }),
    });
    if (!res.ok) {
      setError("처리 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  async function callStop() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/work-permits/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permitId, reason: stopReason.trim() || undefined }),
    });
    if (!res.ok) {
      setError("작업중지 처리 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  if (status === "작업중지" || status === "반려") return null;

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        🔑 승인 처리
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* 서명중 → 검토중 */}
      {status === "서명중" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            작업자 서명 수집이 완료되면 검토 단계로 이동한 뒤 각 관리자가 서명할 수 있습니다.
          </p>
          <button
            onClick={callReview}
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {loading ? "처리 중…" : "검토 단계로 이동"}
          </button>
        </div>
      )}

      {/* 검토중 → 위의 "관리자 서명 확인" 섹션에서 처리 */}
      {status === "검토중" && (
        <p className="text-sm text-gray-500">
          위의 <span className="font-semibold text-gray-700">관리자 서명 확인</span> 섹션에서 각 역할별로 서명 또는 반려를 처리해주세요.
        </p>
      )}

      {/* 승인완료 → 작업중지 */}
      {status === "승인완료" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            긴급 상황 시 작업을 즉시 중지할 수 있습니다.
          </p>
          {!showStopForm ? (
            <button
              onClick={() => setShowStopForm(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              🚫 작업중지
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                placeholder="작업중지 사유 (선택)"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={callStop}
                  disabled={loading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors"
                >
                  {loading ? "처리 중…" : "작업중지 확정"}
                </button>
                <button
                  onClick={() => setShowStopForm(false)}
                  className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
