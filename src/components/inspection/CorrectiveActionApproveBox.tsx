"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Props {
  actionId: string;
}

export default function CorrectiveActionApproveBox({ actionId }: Props) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<"" | "approve" | "reject">("");
  const [approvedBy, setApprovedBy] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle(action: "approve" | "reject") {
    setError("");

    if (!approvedBy.trim()) {
      setError("승인자 이름을 입력해주세요.");
      return;
    }
    if (action === "reject" && !rejectionReason.trim()) {
      setError("반려 사유를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/corrective-actions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionId,
          action,
          approved_by: approvedBy.trim(),
          rejection_reason: action === "reject" ? rejectionReason.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "처리 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      router.push("/corrective-actions");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        🔍 관리자 최종 확인
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          승인자 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="소장/안전전담자 이름"
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {selectedAction === "reject" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            반려 사유 <span className="text-red-500">*</span>
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
        {selectedAction !== "reject" ? (
          <>
            <Button
              onClick={() => handle("approve")}
              loading={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              ✅ 완료 승인
            </Button>
            <Button
              variant="danger"
              onClick={() => setSelectedAction("reject")}
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
              onClick={() => setSelectedAction("")}
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
