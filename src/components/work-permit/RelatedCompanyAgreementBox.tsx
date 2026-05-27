"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RelatedCompanyAgreement } from "@/types";
import SignaturePad from "@/components/tbm/SignaturePad";

interface Props {
  permitId: string;
  agreements: RelatedCompanyAgreement[];
  isLocked: boolean;
}

export default function RelatedCompanyAgreementBox({
  permitId,
  agreements,
  isLocked,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);

  function resetForm() {
    setCompanyName("");
    setContactName("");
    setSignatureData(null);
    setError("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("협력사명을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permitId,
        company_name: companyName,
        contact_name: contactName || null,
        signature_data: signatureData,
      }),
    });

    if (!res.ok) {
      setError("저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    resetForm();
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(agreementId: string) {
    if (!confirm("이 협력사 합의를 삭제하시겠습니까?")) return;
    const res = await fetch("/api/work-permits/agreements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreementId }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-xl bg-white border border-purple-100 p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">🤝 관련 협력사 합의</h2>
        {!isLocked && (
          <button
            onClick={() => {
              setShowForm((v) => !v);
              if (showForm) resetForm();
            }}
            className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 rounded-lg px-3 py-1 hover:bg-purple-50 transition-colors"
          >
            {showForm ? "닫기" : "+ 협력사 추가"}
          </button>
        )}
      </div>

      {agreements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600">
                  No
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600">
                  협력사명
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600">
                  담당자명
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-600">
                  서명
                </th>
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-600">
                  서명일시
                </th>
                {!isLocked && (
                  <th className="border border-gray-200 px-2 py-1.5 w-8" />
                )}
              </tr>
            </thead>
            <tbody>
              {agreements.map((agr, idx) => (
                <tr key={agr.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 font-medium text-gray-900">
                    {agr.company_name}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-600">
                    {agr.contact_name ?? "-"}
                  </td>
                  <td
                    className="border border-gray-200 px-2 py-1.5 text-center"
                    style={{ minWidth: "80px", height: "44px" }}
                  >
                    {agr.signature_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agr.signature_data}
                        alt="서명"
                        className="h-8 max-w-[80px] mx-auto border border-gray-100 rounded bg-white px-0.5"
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-500">
                    {agr.signed_at
                      ? new Date(agr.signed_at).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  {!isLocked && (
                    <td className="border border-gray-200 px-2 py-1.5 text-center">
                      <button
                        onClick={() => handleDelete(agr.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">등록된 협력사 합의가 없습니다.</p>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mt-4 border-t border-gray-100 pt-4 space-y-4"
        >
          <p className="text-xs font-semibold text-gray-600">협력사 합의 추가</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">협력사명 *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="(주)○○기계"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">담당자명</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">서명</label>
            {signatureData ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureData}
                  alt="서명 미리보기"
                  className="h-12 border border-gray-200 rounded bg-white px-1"
                />
                <button
                  type="button"
                  onClick={() => setSignatureData(null)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  다시 서명
                </button>
              </div>
            ) : (
              <SignaturePad onSave={(dataUrl) => setSignatureData(dataUrl)} />
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 rounded-xl transition-colors"
            >
              {loading ? "저장 중…" : "추가"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
