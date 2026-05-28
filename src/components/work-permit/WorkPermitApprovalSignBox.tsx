"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/tbm/SignaturePad";
import type { WorkPermitApproval } from "@/types";

const APPROVAL_ROLES = ["작성자", "안전전담자", "소장대표"] as const;

interface Props {
  permitId: string;
  permitStatus: string;
  approvals: WorkPermitApproval[];
}

type ModalState =
  | { type: "none" }
  | { type: "sign"; role: string; approval: WorkPermitApproval | null }
  | { type: "reject"; role: string; approval: WorkPermitApproval | null };

const STATUS_STYLE: Record<string, string> = {
  승인: "bg-green-100 text-green-700 border-green-200",
  반려: "bg-red-100 text-red-700 border-red-200",
  대기: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function WorkPermitApprovalSignBox({
  permitId,
  permitStatus,
  approvals,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [signerName, setSignerName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 검토중 또는 이후 상태에서만 서명 가능
  const canSign = permitStatus === "검토중";

  function findApproval(role: string) {
    return approvals.find((a) => a.approver_role === role) ?? null;
  }

  function openSignModal(role: string) {
    const existing = findApproval(role);
    setSignerName(existing?.approver_name || "");
    setSignatureData(null);
    setError("");
    setModal({ type: "sign", role, approval: existing });
  }

  function openRejectModal(role: string) {
    const existing = findApproval(role);
    setSignerName(existing?.approver_name || "");
    setRejectionReason("");
    setError("");
    setModal({ type: "reject", role, approval: existing });
  }

  function closeModal() {
    setModal({ type: "none" });
    setSignerName("");
    setSignatureData(null);
    setRejectionReason("");
    setError("");
  }

  async function handleApprove() {
    if (!signatureData) {
      setError("서명을 입력해주세요.");
      return;
    }
    if (!signerName.trim()) {
      setError("서명자 이름을 입력해주세요.");
      return;
    }
    if (modal.type !== "sign") return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/sign-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvalId: modal.approval?.id ?? null,
        permitId,
        action: "approve",
        role: modal.role,
        approverName: signerName.trim(),
        signatureData,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error === "approver_name_required" ? "서명자 이름을 입력해주세요." :
               d.error === "signature_required" ? "서명을 입력해주세요." :
               "처리 중 오류가 발생했습니다.");
      return;
    }

    closeModal();
    router.refresh();
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("반려 사유를 입력해주세요.");
      return;
    }
    if (modal.type !== "reject") return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/sign-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvalId: modal.approval?.id ?? null,
        permitId,
        action: "reject",
        role: modal.role,
        approverName: signerName.trim(),
        rejectionReason: rejectionReason.trim(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("처리 중 오류가 발생했습니다.");
      return;
    }

    closeModal();
    router.refresh();
  }

  return (
    <>
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
          ✍️ 관리자 서명 확인
        </h2>

        <div className="space-y-3">
          {APPROVAL_ROLES.map((role) => {
            const a = findApproval(role);
            const status = a?.approval_status ?? "대기";
            const isSigned = status === "승인";

            return (
              <div
                key={role}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* 역할 */}
                  <span className="text-sm font-semibold text-gray-700 w-20 shrink-0">
                    {role}
                  </span>

                  {/* 상태 배지 */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_STYLE[status] ?? STATUS_STYLE["대기"]}`}
                  >
                    {status}
                  </span>

                  {/* 서명자 정보 */}
                  {isSigned && a && (
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {a.approver_name}
                      </span>
                      {a.signature_data && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.signature_data}
                          alt={`${a.approver_name} 서명`}
                          className="h-8 border border-gray-200 rounded bg-white px-1"
                        />
                      )}
                      {a.approved_at && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(a.approved_at).toLocaleString("ko-KR")}
                        </span>
                      )}
                    </div>
                  )}
                  {status === "반려" && a?.approver_name && (
                    <span className="text-sm text-gray-500">{a.approver_name}</span>
                  )}
                </div>

                {/* 서명하기 / 반려 버튼 */}
                {canSign && status === "대기" && (
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => openSignModal(role)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      서명하기
                    </button>
                    <button
                      onClick={() => openRejectModal(role)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      반려
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {permitStatus === "서명중" && (
          <p className="mt-4 text-xs text-gray-400">
            작업자 서명 수집 후 &quot;검토 단계로 이동&quot; 버튼을 클릭하면 서명 버튼이 활성화됩니다.
          </p>
        )}
        {permitStatus === "작성중" && (
          <p className="mt-4 text-xs text-gray-400">
            작업허가서 작성 완료 후 서명을 진행할 수 있습니다.
          </p>
        )}
      </section>

      {/* ── 서명 모달 ── */}
      {modal.type === "sign" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                {modal.role} 서명
              </h3>

              {/* 서명자 이름 */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  서명자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 서명 캔버스 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  전자서명 <span className="text-red-500">*</span>
                </p>
                <SignaturePad
                  onSave={(dataUrl) => setSignatureData(dataUrl)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={loading || !signatureData}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-xl transition-colors"
                >
                  {loading ? "처리 중…" : "✅ 서명 완료"}
                </button>
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 반려 모달 ── */}
      {modal.type === "reject" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                {modal.role} — 반려
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  서명자 이름 (선택)
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-xl transition-colors"
                >
                  {loading ? "처리 중…" : "반려 확정"}
                </button>
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
