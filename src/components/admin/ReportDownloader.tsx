"use client";

import Link from "next/link";
import type { Training } from "@/types";

export default function ReportDownloader({ training }: { training: Training }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{training.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(training.created_at).toLocaleDateString("ko-KR")} 등록
        </p>
      </div>
      <Link
        href={`/print/training/${training.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        🖨️ 이수 기록 출력 / PDF 저장
      </Link>
    </div>
  );
}
