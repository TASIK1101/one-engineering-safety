"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { generateTrainingReport } from "@/lib/pdf";
import type { Training } from "@/types";

export default function ReportDownloader({ training }: { training: Training }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleDownload() {
    setLoading(true);
    const { data: assignments } = await supabase
      .from("training_assignments")
      .select("*, employees(*)")
      .eq("training_id", training.id)
      .eq("status", "completed");

    if (!assignments || assignments.length === 0) {
      alert("완료된 교육 기록이 없습니다.");
      setLoading(false);
      return;
    }

    await generateTrainingReport(training, assignments as any);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{training.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(training.created_at).toLocaleDateString("ko-KR")} 생성
        </p>
      </div>
      <Button
        onClick={handleDownload}
        loading={loading}
        variant="secondary"
        className="gap-2"
      >
        📄 PDF 다운로드
      </Button>
    </div>
  );
}
