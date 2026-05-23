"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  signUrl: string;
}

export default function TBMSignLinkBox({ signUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signUrl);
    } catch {
      // 클립보드 API 미지원 브라우저 대응
      const el = document.createElement("textarea");
      el.value = signUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📱</span>
        <p className="text-base font-bold text-blue-900">근로자 서명 링크</p>
      </div>
      <p className="text-xs text-blue-600 mb-4 leading-relaxed">
        아래 링크를 카카오톡으로 공유하거나 QR 코드를 보여주세요.
        <br />
        <strong>로그인 없이</strong> 휴대폰으로 바로 서명할 수 있습니다.
      </p>

      {/* URL 표시 */}
      <div className="bg-white border border-blue-200 rounded-lg px-3 py-2.5 mb-3 select-all">
        <p className="text-xs text-blue-700 break-all font-mono leading-relaxed">
          {signUrl}
        </p>
      </div>

      {/* 버튼 행 */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={copyLink}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-xl border-2 transition-all ${
            copied
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-white border-blue-300 text-blue-700 hover:bg-blue-100 active:scale-95"
          }`}
        >
          <span>{copied ? "✓" : "🔗"}</span>
          {copied ? "복사됨!" : "링크 복사"}
        </button>
        <a
          href={signUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all"
        >
          서명 페이지 열기 →
        </a>
      </div>

      {/* QR 토글 */}
      <button
        type="button"
        onClick={() => setShowQR((v) => !v)}
        className="w-full text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 flex items-center justify-center gap-1 transition-colors"
      >
        <span>{showQR ? "▲" : "▼"}</span>
        {showQR ? "QR 코드 숨기기" : "QR 코드 보기"}
      </button>

      {/* QR 코드 */}
      {showQR && (
        <div className="mt-3 flex flex-col items-center bg-white rounded-xl p-5 border border-blue-200 gap-3">
          <QRCodeSVG
            value={signUrl}
            size={200}
            level="M"
            includeMargin
          />
          <p className="text-xs text-gray-400 text-center">
            카메라로 QR 코드를 스캔하면 서명 페이지로 이동합니다
          </p>
        </div>
      )}
    </div>
  );
}
