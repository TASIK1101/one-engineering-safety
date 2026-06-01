"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PpeItemForm from "@/components/ppe/PpeItemForm";
import { resolveCertUrl } from "@/lib/ppe";
import type { PpeItem } from "@/types";

export default function PpeItemCard({ item }: { item: PpeItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const certUrl = resolveCertUrl(item.certificate_file_url);

  async function toggleActive() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/ppe/items/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(`상태 변경 실패: ${d.detail ?? d.error ?? "오류"}`);
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">품목 수정</h2>
          <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:text-gray-600">
            취소
          </button>
        </div>
        <PpeItemForm item={item} />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{item.category}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
            {item.active ? "사용중" : "비활성"}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg">
            수정
          </button>
          <button onClick={toggleActive} disabled={loading} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50">
            {item.active ? "비활성화" : "활성화"}
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-4">{item.item_name}</h1>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Row label="모델명" value={item.model_name} />
        <Row label="제조사" value={item.manufacturer} />
        <Row label="안전인증번호" value={item.certification_number} />
        <Row label="인증일자" value={item.certification_date} />
        <Row label="인증기관" value={item.certification_agency} />
        <Row label="교체주기" value={item.replacement_cycle_months ? `${item.replacement_cycle_months}개월` : null} />
      </dl>

      {item.description && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1">비고</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">인증서 파일</p>
        {certUrl ? (
          <a href={certUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            📄 인증서 새 창으로 보기 →
          </a>
        ) : (
          <p className="text-sm text-gray-400">등록된 인증서 파일이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-gray-800 font-medium">{value || "-"}</dd>
    </div>
  );
}
