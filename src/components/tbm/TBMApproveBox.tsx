"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Props {
  tbmId: string;
  canApprove: boolean;
}

export default function TBMApproveBox({ tbmId, canApprove }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  async function handle(action: "approve" | "reject") {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tbm/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tbmId, action, approvedBy, rejectionReason }),
    });
    if (!res.ok) {
      setError("처리 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  if (!canApprove) {
    return (
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          ✏️ 반려된 TBM
        </h2>
        <p className="text-sm text-gray-500">
          반려된 TBM입니다. 내용을 확인하고 수정이 필요하면 관리자에게 문의하세요.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        🔍 관리자 최종 확인
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          승인자 이름
        </label>
        <input
          type="text"
          placeholder="소장/안전전담자 이름"
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showReject && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            반려 사유
          </label>
          <textarea
            rows={3}
            placeholder="반려 사유를 입력하세요."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-2">
        {!showReject ? (
          <>
            <Button
              onClick={() => handle("approve")}
              loading={loading}
              className="flex-1"
            >
              ✅ 승인 완료
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowReject(true)}
              disabled={loading}
              className="flex-1"
            >
              반려
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="danger"
              onClick={() => handle("reject")}
              loading={loading}
              className="flex-1"
            >
              반려 확정
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowReject(false)}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
