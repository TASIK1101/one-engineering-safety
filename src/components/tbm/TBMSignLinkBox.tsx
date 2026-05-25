"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  signToken: string;
}

export default function TBMSignLinkBox({ signToken }: Props) {
  const [signUrl, setSignUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // 클라이언트 실행 시점의 origin으로 URL 생성
  // → Preview 배포 URL이 바뀌어도 항상 현재 도메인 기준으로 생성됨
  useEffect(() => {
    setSignUrl(`${window.location.origin}/tbm/sign/${signToken}`);
  }, [signToken]);

  const copyLink = async () => {
    if (!signUrl) return;
    try {
      await navigator.clipboard.writeText(signUrl);
    } catch {
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
      <div className="bg-white border border-blue-200 rounded-lg px-3 py-2.5 mb-3 select-all min-h-[40px]">
        {signUrl ? (
          <p className="text-xs text-blue-700 break-all font-mono leading-relaxed">
            {signUrl}
          </p>
        ) : (
          <p className="text-xs text-gray-300">링크 생성 중...</p>
        )}
      </div>

      {/* 버튼 행 */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={copyLink}
          disabled={!signUrl}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-xl border-2 transition-all ${
            copied
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-white border-blue-300 text-blue-700 hover:bg-blue-100 active:scale-95"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span>{copied ? "✓" : "🔗"}</span>
          {copied ? "복사됨!" : "링크 복사"}
        </button>
        <a
          href={signUrl || "#"}
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

      {/* QR 코드 — signUrl 준비됐을 때만 렌더링 */}
      {showQR && (
        <div className="mt-3 flex flex-col items-center bg-white rounded-xl p-5 border border-blue-200 gap-3">
          {signUrl ? (
            <>
              <QRCodeSVG value={signUrl} size={200} level="M" includeMargin />
              <p className="text-xs text-gray-400 text-center">
                카메라로 QR 코드를 스캔하면 서명 페이지로 이동합니다
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-300 py-8">QR 생성 중...</p>
          )}
        </div>
      )}
    </div>
  );
}
