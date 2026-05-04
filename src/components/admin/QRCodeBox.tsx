"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function QRCodeBox({ shareUrl }: { shareUrl: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors"
      >
        {show ? "QR 코드 숨기기 ▲" : "QR 코드로 공유하기 ▼"}
      </button>

      {show && (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-xs text-gray-500 mb-1">
            현장에서 이 QR 코드를 보여주면 직원들이 바로 접속할 수 있습니다
          </p>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              fgColor="#1e3a5f"
              bgColor="#ffffff"
              level="M"
            />
          </div>
          <p className="text-[11px] text-gray-400 break-all text-center mt-1">
            {shareUrl}
          </p>
        </div>
      )}
    </div>
  );
}
