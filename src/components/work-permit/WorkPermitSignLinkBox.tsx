"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  permitToken: string;
}

export default function WorkPermitSignLinkBox({ permitToken }: Props) {
  const [signUrl, setSignUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setSignUrl(`${window.location.origin}/work-permits/sign/${permitToken}`);
  }, [permitToken]);

  async function handleCopy() {
    if (!signUrl) return;
    await navigator.clipboard.writeText(signUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!signUrl) return null;

  return (
    <div className="rounded-xl bg-white border border-blue-200 p-4 shadow-sm mt-4">
      <p className="text-sm font-semibold text-gray-800 mb-1">작업자 서명 링크</p>
      <p className="text-xs text-gray-400 mb-3">
        이 링크를 작업자들에게 공유하면 본인확인 후 서명할 수 있습니다.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-xs text-blue-700 font-mono break-all select-all">{signUrl}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className={`flex-1 min-w-[120px] py-2 text-sm font-medium rounded-lg transition-colors ${
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {copied ? "✓ 복사됨!" : "링크 복사"}
        </button>
        <button
          onClick={() => setShowQR((v) => !v)}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {showQR ? "QR 닫기" : "QR 보기"}
        </button>
      </div>

      {showQR && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-5">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <QRCodeSVG value={signUrl} size={160} fgColor="#1e3a5f" bgColor="#ffffff" level="M" />
          </div>
          <p className="text-xs text-gray-500 text-center">
            작업자가 카메라로 스캔하면 서명 페이지로 이동합니다.
          </p>
        </div>
      )}
    </div>
  );
}
