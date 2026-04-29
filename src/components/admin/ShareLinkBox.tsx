"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ShareLinkBox({
  trainingId,
}: {
  trainingId: string;
  trainingTitle?: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/training/${trainingId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handlePreview() {
    window.open(shareUrl, "_blank");
  }

  return (
    <div className="rounded-xl bg-white border border-blue-200 p-5 shadow-sm mb-5">
      <h2 className="font-semibold text-gray-800 mb-0.5">교육 참여 링크</h2>
      <p className="text-xs text-gray-400 mb-3">
        이 링크 하나를 단톡방이나 문자에 공유하면 모든 직원이 접속해
        본인 확인 후 교육을 이수할 수 있습니다.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-3">
        <span className="text-sm text-blue-700 font-mono break-all select-all">
          {shareUrl}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          className={`flex-1 ${copied ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {copied ? "✓ 복사됨!" : "교육 참여 링크 복사"}
        </Button>
        <Button variant="secondary" onClick={handlePreview}>
          미리보기
        </Button>
      </div>
    </div>
  );
}
