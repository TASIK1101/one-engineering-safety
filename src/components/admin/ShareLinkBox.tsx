"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import QRCodeBox from "./QRCodeBox";

export default function ShareLinkBox({
  trainingId,
}: {
  trainingId: string;
  trainingTitle?: string;
}) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = `${appUrl}/training/${trainingId}`;

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
        이 링크 하나를 카카오톡 단체방이나 문자로 공유하면 모든 교육 대상자가
        접속할 수 있습니다.
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
          직원 화면 미리보기
        </Button>
      </div>

      {/* QR 코드 */}
      <QRCodeBox shareUrl={shareUrl} />
    </div>
  );
}
