"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function DuplicateTrainingButton({
  trainingId,
}: {
  trainingId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDuplicate() {
    if (
      !confirm(
        "이 교육을 복사해 오늘 날짜의 새 작업 전 안전교육을 만드시겠습니까?\n(작업일만 오늘로 변경되고 나머지 내용은 유지됩니다)"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/duplicate-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "복사 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      router.push(`/trainings/${data.id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleDuplicate}
        loading={loading}
        className="text-sm"
      >
        복사해서 오늘 교육 만들기
      </Button>
      {error && (
        <p className="text-xs text-red-500 mt-1 text-right">{error}</p>
      )}
    </div>
  );
}
