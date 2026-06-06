"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { WorkPermitApproval, Employee } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  승인: "bg-green-100 text-green-700 border-green-200",
  반려: "bg-red-100 text-red-700 border-red-200",
  대기: "bg-amber-50 text-amber-700 border-amber-200",
};

interface Props {
  permitId: string;
  approvals: WorkPermitApproval[];
  employees: Employee[];
  /** 완료/반려/작업중지/잠금 문서는 담당자 변경 불가 (읽기 전용) */
  canAssign: boolean;
}

export default function WorkPermitApprovalLinkBox({
  permitId,
  approvals,
  employees,
  canAssign,
}: Props) {
  const ROLES = ["작성자", "안전전담자", "소장대표"] as const;

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
        관리자 전자승인 현황
      </h2>
      <div className="space-y-4">
        {ROLES.map((role) => {
          const a = approvals.find((ap) => ap.approver_role === role);
          return (
            <ApprovalCard
              key={role}
              permitId={permitId}
              role={role}
              approval={a ?? null}
              employees={employees}
              canAssign={canAssign}
            />
          );
        })}
      </div>
    </section>
  );
}

function ApprovalCard({
  permitId,
  role,
  approval,
  employees,
  canAssign,
}: {
  permitId: string;
  role: string;
  approval: WorkPermitApproval | null;
  employees: Employee[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // 담당자 지정/변경 상태
  const [editing, setEditing] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (approval?.approval_token && approval.approver_employee_id) {
      setUrl(
        `${window.location.origin}/work-permits/approve/${approval.approval_token}`
      );
    } else {
      setUrl("");
    }
  }, [approval]);

  const status = approval?.approval_status ?? "대기";
  const isDone = status === "승인" || status === "반려";
  const hasEmployee = !!approval?.approver_employee_id;
  const isPending = status === "대기";

  async function copyLink() {
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
  }

  async function saveAssign() {
    if (!selectedEmp) {
      setError("담당 직원을 선택하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/work-permits/assign-approver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permitId, role, employeeId: selectedEmp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error === "invalid_employee"
            ? "유효하지 않은 직원입니다."
            : data.error === "already_processed"
            ? "이미 처리된 역할은 변경할 수 없습니다."
            : data.error === "permit_locked"
            ? "완료/반려된 문서는 변경할 수 없습니다."
            : "저장 중 오류가 발생했습니다."
        );
        setSaving(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("네트워크 오류. 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      {/* 역할 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 w-20 shrink-0">
            {role}
          </span>
          {approval?.approver_name ? (
            <span className="text-sm text-gray-700">{approval.approver_name}</span>
          ) : (
            <span className="text-xs text-amber-600 font-medium">담당자 미지정</span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              STATUS_STYLE[status] ?? STATUS_STYLE["대기"]
            }`}
          >
            {status}
          </span>
        </div>

        {/* 서명 미리보기 (승인된 경우) */}
        {status === "승인" && approval?.signature_data && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={approval.signature_data}
            alt={`${approval.approver_name} 서명`}
            className="h-8 border border-gray-200 rounded bg-white px-1"
          />
        )}
      </div>

      {/* 승인일시 */}
      {isDone && approval?.approved_at && (
        <p className="text-xs text-gray-400 mb-2">
          {new Date(approval.approved_at).toLocaleString("ko-KR")}
        </p>
      )}

      {/* 반려 사유 */}
      {status === "반려" && approval?.rejection_reason && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">
          반려 사유: {approval.rejection_reason}
        </p>
      )}

      {/* 대기 상태: 담당자 지정 + 링크 공유 */}
      {isPending && (
        <>
          {/* 담당자 지정/변경 폼 */}
          {canAssign && (editing || !hasEmployee) && (
            <div className="space-y-2 mb-3">
              {employees.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  등록된 직원이 없습니다. 직원 관리에서 먼저 등록해 주세요.
                </p>
              ) : (
                <>
                  <select
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">— 담당 직원 선택 —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                        {emp.department ? ` (${emp.department})` : ""}
                        {!emp.phone ? " · 전화번호 없음" : ""}
                      </option>
                    ))}
                  </select>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    {hasEmployee && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setError("");
                        }}
                        disabled={saving}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white"
                      >
                        취소
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={saveAssign}
                      disabled={saving || !selectedEmp}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {saving ? "저장 중..." : "담당자 저장"}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    선택한 직원의 이름·전화번호 뒷자리로 본인 확인 후 서명합니다.
                  </p>
                </>
              )}
            </div>
          )}

          {/* 미지정 + 변경 불가(읽기전용) 안내 */}
          {!canAssign && !hasEmployee && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              담당자가 지정되지 않았습니다.
            </p>
          )}

          {/* 담당자 지정됨 + 편집중 아님 → 링크 공유 */}
          {hasEmployee && !editing && (
            <div className="space-y-2">
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 select-all">
                <p className="text-[11px] text-blue-700 break-all font-mono">
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
                      : "bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  } disabled:opacity-40`}
                >
                  {copied ? "✓ 복사됨" : "🔗 링크 복사"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {showQR ? "QR 숨기기" : "QR 보기"}
                </button>
              </div>
              {showQR && url && (
                <div className="flex justify-center bg-white rounded-xl p-4 border border-blue-200">
                  <QRCodeSVG value={url} size={160} level="M" includeMargin />
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  이 링크를 {role}에게 전달하면 본인 확인 후 전자서명합니다.
                </p>
                {canAssign && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmp(approval?.approver_employee_id ?? "");
                      setEditing(true);
                      setError("");
                    }}
                    className="text-[11px] text-gray-500 underline hover:text-gray-700 shrink-0 ml-2"
                  >
                    담당자 변경
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
