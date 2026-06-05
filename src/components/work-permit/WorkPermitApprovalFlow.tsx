"use client";

import { useState } from "react";
import SignaturePad from "@/components/tbm/SignaturePad";

interface PermitSummary {
  grade: string;
  permit_type: string;
  work_name: string | null;
  work_location: string | null;
  work_period_start: string | null;
  work_period_end: string | null;
}

interface Props {
  approvalToken: string;
  approverRole: string;
  roleLabel: string;
  permit: PermitSummary;
}

type Screen = "verify" | "review" | "sign" | "reject" | "done";

const ERROR_MAP: Record<string, string> = {
  invalid_input: "입력값이 올바르지 않습니다.",
  invalid_token: "유효하지 않거나 만료된 승인 링크입니다.",
  no_employee_assigned: "담당자가 지정되지 않은 승인 항목입니다.",
  name_mismatch: "이름 또는 전화번호가 일치하지 않습니다.",
  phone_mismatch: "이름 또는 전화번호가 일치하지 않습니다.",
  already_done: "이미 승인이 완료된 항목입니다.",
  permit_locked: "이미 최종 처리된 허가서입니다.",
  signature_required: "서명을 입력해주세요.",
  reason_required: "반려 사유를 입력해주세요.",
  server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

function errMsg(code: string) {
  return ERROR_MAP[code] ?? `오류가 발생했습니다. (${code})`;
}

export default function WorkPermitApprovalFlow({
  approvalToken,
  approverRole,
  roleLabel,
  permit,
}: Props) {
  const [screen, setScreen] = useState<Screen>("verify");
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneAction, setDoneAction] = useState<"approve" | "reject">("approve");

  async function handleVerify() {
    if (!name.trim() || !/^\d{4}$/.test(phoneLast4)) {
      setError("이름과 전화번호 뒷 4자리를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/work-permits/approval/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalToken, name: name.trim(), phoneLast4 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(errMsg(data.error));
        return;
      }
      setVerifiedName(data.approverName);
      setScreen("review");
    } finally {
      setLoading(false);
    }
  }

  async function handleSign(action: "approve" | "reject") {
    if (action === "approve" && !signatureData) {
      setError("서명을 입력해주세요.");
      return;
    }
    if (action === "reject" && !rejectionReason.trim()) {
      setError("반려 사유를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/work-permits/approval/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalToken,
          name: verifiedName,
          phoneLast4,
          action,
          signatureData: action === "approve" ? signatureData : undefined,
          rejectionReason: action === "reject" ? rejectionReason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(errMsg(data.error));
        return;
      }
      setDoneAction(action);
      setScreen("done");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  // ── 1. 본인확인 ────────────────────────────────────────────────
  if (screen === "verify") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="text-center">
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-3">
            {roleLabel}
          </span>
          <h2 className="text-base font-bold text-gray-900">본인 확인</h2>
          <p className="text-xs text-gray-500 mt-1">
            {permit.grade}급 작업허가서 — {permit.permit_type}
          </p>
        </div>

        {/* 허가서 요약 */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-1.5 text-xs text-gray-700">
          {permit.work_name && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">작업명</span>
              <span>{permit.work_name}</span>
            </div>
          )}
          {permit.work_location && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">장소</span>
              <span>{permit.work_location}</span>
            </div>
          )}
          {(permit.work_period_start || permit.work_period_end) && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">기간</span>
              <span>
                {permit.work_period_start ?? "-"} ~ {permit.work_period_end ?? "-"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              전화번호 뒷 4자리 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={phoneLast4}
              onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || !name.trim() || phoneLast4.length !== 4}
          className="w-full py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-colors"
        >
          {loading ? "확인 중..." : "본인 확인"}
        </button>
      </div>
    );
  }

  // ── 2. 내용 검토 ──────────────────────────────────────────────
  if (screen === "review") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="text-center">
          <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-3">
            본인 확인 완료
          </span>
          <h2 className="text-base font-bold text-gray-900">{verifiedName}님</h2>
          <p className="text-xs text-gray-500 mt-1">
            아래 작업허가서 내용을 검토 후 서명해주세요.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-xs text-gray-700">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500 w-16 shrink-0">역할</span>
            <span className="font-semibold text-blue-700">{roleLabel}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500 w-16 shrink-0">등급</span>
            <span>{permit.grade}급 — {permit.permit_type}</span>
          </div>
          {permit.work_name && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">작업명</span>
              <span>{permit.work_name}</span>
            </div>
          )}
          {permit.work_location && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">장소</span>
              <span>{permit.work_location}</span>
            </div>
          )}
          {(permit.work_period_start || permit.work_period_end) && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-500 w-16 shrink-0">기간</span>
              <span>
                {permit.work_period_start ?? "-"} ~ {permit.work_period_end ?? "-"}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setError(""); setScreen("reject"); }}
            className="flex-1 py-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors"
          >
            반려
          </button>
          <button
            onClick={() => { setError(""); setScreen("sign"); }}
            className="flex-1 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
          >
            서명하기
          </button>
        </div>
      </div>
    );
  }

  // ── 3. 전자서명 ───────────────────────────────────────────────
  if (screen === "sign") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="text-center">
          <h2 className="text-base font-bold text-gray-900">전자서명</h2>
          <p className="text-xs text-gray-500 mt-1">
            {verifiedName}님 ({roleLabel})
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            서명 <span className="text-red-500">*</span>
          </p>
          <SignaturePad
            onSave={(dataUrl) => setSignatureData(dataUrl)}
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setError(""); setScreen("review"); }}
            disabled={loading}
            className="px-5 py-3 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            이전
          </button>
          <button
            onClick={() => handleSign("approve")}
            disabled={loading || !signatureData}
            className="flex-1 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {loading ? "처리 중..." : "승인 완료"}
          </button>
        </div>
      </div>
    );
  }

  // ── 4. 반려 ───────────────────────────────────────────────────
  if (screen === "reject") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="text-center">
          <h2 className="text-base font-bold text-gray-900">반려 처리</h2>
          <p className="text-xs text-gray-500 mt-1">
            {verifiedName}님 ({roleLabel})
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            반려 사유 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="반려 사유를 입력하세요."
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setError(""); setScreen("review"); }}
            disabled={loading}
            className="px-5 py-3 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            이전
          </button>
          <button
            onClick={() => handleSign("reject")}
            disabled={loading || !rejectionReason.trim()}
            className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {loading ? "처리 중..." : "반려 확정"}
          </button>
        </div>
      </div>
    );
  }

  // ── 5. 완료 ───────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
      <span className="text-5xl block">{doneAction === "approve" ? "✅" : "❌"}</span>
      <h2 className="text-base font-bold text-gray-900">
        {doneAction === "approve" ? "승인이 완료되었습니다" : "반려 처리되었습니다"}
      </h2>
      <p className="text-sm text-gray-500">
        {verifiedName}님 ({roleLabel}) — {permit.grade}급 작업허가서
      </p>
      <p className="text-xs text-gray-400 mt-2">이 창을 닫아도 됩니다.</p>
    </div>
  );
}
