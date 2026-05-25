"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  signToken: string;
}

export default function TBMPhoneVerifyForm({ signToken }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (phoneLast4.length !== 4) {
      setError("전화번호 뒷자리 4자리를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/tbm/verify-attendee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signToken, name: name.trim(), phoneLast4 }),
    });

    if (!res.ok) {
      const d = await res.json();
      if (d.error === "already_signed") {
        setError("이미 서명이 완료된 참석자입니다.");
      } else {
        setError(
          "이름 또는 전화번호 뒷자리가 일치하지 않습니다. 관리자에게 문의하세요."
        );
      }
      setLoading(false);
      return;
    }

    const { attendeeId } = await res.json();
    // sessionStorage에 검증된 attendeeId 저장 → 직접 URL 접근 차단용
    sessionStorage.setItem("verifiedAttendeeId", attendeeId);
    router.push(`/tbm/sign/${signToken}/${attendeeId}`);
  }

  const canSubmit = name.trim().length > 0 && phoneLast4.length === 4;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-base font-bold text-gray-900 mb-1">TBM 서명 본인 확인</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          본인 확인을 위해 이름과 등록된 전화번호 뒷자리 4자리를 입력하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="홍길동"
            autoComplete="name"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* 전화번호 뒷자리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            전화번호 뒷자리 4자리
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={phoneLast4}
            onChange={(e) => {
              setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            placeholder="0000"
            autoComplete="off"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-2xl font-bold text-center tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm leading-relaxed">
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-2xl shadow-sm active:scale-[0.98] transition-all"
        >
          {loading ? "확인 중..." : "확인 후 서명하기 →"}
        </button>
      </form>
    </div>
  );
}
