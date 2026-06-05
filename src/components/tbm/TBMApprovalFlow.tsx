"use client";

import { useState } from "react";
import SignaturePad from "@/components/tbm/SignaturePad";
import type { TbmRecord } from "@/types";

type TbmSummary = Pick<
  TbmRecord,
  "id" | "date" | "work_type" | "process_name" | "worksite_location" | "supervisor" | "hazard_items" | "main_hazard_notes"
>;

interface Props {
  approvalToken: string;
  roleLabel: string;
  tbm: TbmSummary;
}

type Screen = "verify" | "review" | "sign" | "reject" | "done";

export default function TBMApprovalFlow({ approvalToken, roleLabel, tbm }: Props) {
  const [screen, setScreen] = useState<Screen>("verify");
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultAction, setResultAction] = useState<"승인" | "반려" | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("이름을 입력해 주세요.");
    if (phoneLast4.length !== 4) return setError("전화번호 뒷자리 4자리를 입력해 주세요.");

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tbm/approval/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalToken, name: name.trim(), phoneLast4 }),
      });
      if (!res.ok) {
        const d = await res.json();
        if (d.error === "already_approved") setError("이미 전자확인이 완료되었습니다.");
        else setError("이름 또는 전화번호 뒷자리가 일치하지 않습니다. 관리자에게 문의하세요.");
        setLoading(false);
        return;
      }
      setScreen("review");
    } catch {
      setError("네트워크 오류. 다시 시도해 주세요.");
    }
    setLoading(false);
  }

  async function submit(action: "승인" | "반려", signatureData?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tbm/approval/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalToken,
          name: name.trim(),
          phoneLast4,
          action,
          signatureData,
          rejectionReason: action === "반려" ? rejectionReason : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        if (d.error === "already_approved") {
          setError("이미 처리된 전자확인입니다.");
        } else {
          setError("처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
        }
        setLoading(false);
        return;
      }
      setResultAction(action);
      setScreen("done");
    } catch {
      setError("네트워크 오류. 다시 시도해 주세요.");
    }
    setLoading(false);
  }

  // ── 완료 ──
  if (screen === "done") {
    const approved = resultAction === "승인";
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className={`px-6 py-5 ${approved ? "bg-blue-700" : "bg-gray-700"}`}>
          <p className="text-white font-bold text-lg">
            {approved ? "전자확인이 완료되었습니다" : "반려 처리되었습니다"}
          </p>
          <p className="text-blue-100 text-sm mt-0.5">
            {tbm.date} {tbm.work_type} TBM
          </p>
        </div>
        <div className="bg-white px-6 py-6 text-sm text-gray-600">
          <p>
            {approved
              ? "전자서명이 정상적으로 기록되었습니다. 이 창을 닫아도 됩니다."
              : "반려 사유가 관리자에게 전달되었습니다. 이 창을 닫아도 됩니다."}
          </p>
        </div>
      </div>
    );
  }

  // ── 본인 확인 ──
  if (screen === "verify") {
    const canSubmit = name.trim().length > 0 && phoneLast4.length === 4;
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-base font-bold text-gray-900 mb-1">{roleLabel} 본인 확인</p>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          본인 확인을 위해 이름과 등록된 전화번호 뒷자리 4자리를 입력하세요.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-2xl shadow-sm active:scale-[0.98] transition-all"
          >
            {loading ? "확인 중..." : "확인 후 내용 보기 →"}
          </button>
        </form>
      </div>
    );
  }

  // ── 반려 ──
  if (screen === "reject") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <p className="text-base font-bold text-gray-900">반려 사유 입력</p>
        <textarea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="반려 사유를 입력하세요."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setScreen("review")}
            disabled={loading}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            ← 취소
          </button>
          <button
            onClick={() => submit("반려")}
            disabled={loading || !rejectionReason.trim()}
            className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl"
          >
            {loading ? "처리 중..." : "반려 확정"}
          </button>
        </div>
      </div>
    );
  }

  // ── 서명 ──
  if (screen === "sign") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            <span className="text-blue-700">{name}</span>님, 아래에 서명해 주세요.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            위 TBM 교육 내용을 확인하였으며, {roleLabel}로서 전자확인합니다.
          </p>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <SignaturePad onSave={(d) => submit("승인", d)} disabled={loading} />
        </div>
        <button
          onClick={() => setScreen("review")}
          className="w-full text-sm text-gray-400 hover:text-gray-600"
        >
          ← 교육 내용 다시 보기
        </button>
      </div>
    );
  }

  // ── 내용 검토 ──
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          TBM 교육 내용
        </p>
        <dl className="text-sm space-y-2 mb-4">
          <div className="flex gap-2">
            <dt className="text-gray-400 w-20 shrink-0">날짜</dt>
            <dd className="text-gray-800">{tbm.date}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-400 w-20 shrink-0">공종</dt>
            <dd className="text-gray-800">
              {tbm.work_type}
              {tbm.process_name ? ` — ${tbm.process_name}` : ""}
            </dd>
          </div>
          {tbm.worksite_location && (
            <div className="flex gap-2">
              <dt className="text-gray-400 w-20 shrink-0">작업장</dt>
              <dd className="text-gray-800">{tbm.worksite_location}</dd>
            </div>
          )}
          {tbm.supervisor && (
            <div className="flex gap-2">
              <dt className="text-gray-400 w-20 shrink-0">실시자</dt>
              <dd className="text-gray-800">{tbm.supervisor}</dd>
            </div>
          )}
        </dl>

        {tbm.hazard_items && tbm.hazard_items.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ 위험요인 및 안전대책</p>
            <ol className="text-xs text-amber-800 space-y-1.5">
              {tbm.hazard_items.map((item, i) => (
                <li key={i}>
                  {i + 1}. {item}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tbm.main_hazard_notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
            <p className="font-semibold text-gray-500 mb-1">당일 특이사항</p>
            <p className="whitespace-pre-wrap">{tbm.main_hazard_notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setScreen("sign")}
        className="w-full py-5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-md active:scale-95 transition-transform"
      >
        내용 확인 완료 → 전자서명
      </button>
      <button
        onClick={() => setScreen("reject")}
        className="w-full py-2.5 text-sm font-medium text-red-500 hover:text-red-700"
      >
        내용에 문제가 있어 반려
      </button>
    </div>
  );
}
