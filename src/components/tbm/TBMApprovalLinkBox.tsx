"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  approvalToken: string;
  roleLabel: string;
}

export default function TBMApprovalLinkBox({ approvalToken, roleLabel }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/tbm/approve/${approvalToken}`);
  }, [approvalToken]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
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
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
      <p className="text-xs font-semibold text-indigo-700 mb-2">
        {roleLabel} 전자확인 링크 — 본인 휴대폰으로 전달하세요
      </p>
      <div className="bg-white border border-indigo-200 rounded px-2 py-1.5 mb-2 select-all">
        <p className="text-[11px] text-indigo-700 break-all font-mono">
          {url || "링크 생성 중..."}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={!url}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all ${
            copied
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          } disabled:opacity-40`}
        >
          {copied ? "✓ 복사됨" : "🔗 링크 복사"}
        </button>
        <button
          type="button"
          onClick={() => setShowQR((v) => !v)}
          className="flex-1 text-xs font-semibold py-2 rounded-lg bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
        >
          {showQR ? "QR 숨기기" : "QR 보기"}
        </button>
      </div>
      {showQR && url && (
        <div className="mt-3 flex justify-center bg-white rounded-lg p-4 border border-indigo-200">
          <QRCodeSVG value={url} size={160} level="M" includeMargin />
        </div>
      )}
    </div>
  );
}
