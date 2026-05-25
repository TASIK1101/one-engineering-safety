"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUploadButton from "@/components/ui/PhotoUploadButton";

interface Props {
  actionId: string;
  currentStatus: string;
  rejectionReason?: string | null;
}

export default function CorrectiveActionUpdateForm({
  actionId,
  currentStatus,
  rejectionReason,
}: Props) {
  const router = useRouter();
  const [actionResult, setActionResult] = useState("");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!actionResult.trim()) {
      setError("조치 결과를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/corrective-actions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionId,
          action_result: actionResult.trim(),
          after_photo_url: afterPhotoUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "처리 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        ✏️ 조치 결과 입력
      </h2>

      {rejectionReason && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">⚠️ 반려 사유</p>
          <p className="text-sm text-red-600">{rejectionReason}</p>
        </div>
      )}

      {currentStatus === "반려" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          반려된 항목입니다. 내용을 수정하여 다시 검토 요청하세요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 조치 결과 텍스트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            조치 결과 <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="조치한 내용을 구체적으로 입력하세요"
            value={actionResult}
            onChange={(e) => setActionResult(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 조치 후 사진 업로드 */}
        <PhotoUploadButton
          folder={`corrective-actions/${actionId}`}
          label="조치 후 사진 (선택)"
          currentUrl={afterPhotoUrl || null}
          onUpload={(url) => setAfterPhotoUrl(url)}
          disabled={loading}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
        >
          {loading ? "제출 중..." : "조치 결과 제출 (검토 요청)"}
        </button>
      </form>
    </section>
  );
}
