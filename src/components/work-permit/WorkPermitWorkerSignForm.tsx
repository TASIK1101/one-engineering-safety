"use client";

import { useState } from "react";
import SignaturePad from "@/components/tbm/SignaturePad";
import type { WorkPermit, WorkPermitItem, WorkPermitWorker } from "@/types";

type Screen = "content" | "sign" | "done" | "already_done";

interface Props {
  permit: Pick<WorkPermit, "grade" | "permit_type" | "work_name" | "work_location" | "supervisor_name">;
  worker: WorkPermitWorker;
  items: WorkPermitItem[];
}

export default function WorkPermitWorkerSignForm({ permit, worker, items }: Props) {
  const [screen, setScreen] = useState<Screen>(
    worker.signed_at ? "already_done" : "content"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedAt, setSignedAt] = useState<string | null>(null);

  async function handleSign(dataUrl: string) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/work-permits/sign-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId: worker.id, signatureData: dataUrl }),
    });
    if (!res.ok) {
      const d = await res.json();
      if (d.error === "already_signed") {
        setScreen("already_done");
        return;
      }
      setError("서명 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
      return;
    }
    setSignedAt(new Date().toLocaleString("ko-KR"));
    setScreen("done");
    setLoading(false);
  }

  const applyItems = items.filter((i) => i.apply_status === "신청");
  // 카테고리 그룹핑
  const grouped = applyItems.reduce<Record<string, WorkPermitItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (screen === "already_done") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-green-600 px-6 py-5">
          <p className="text-white font-bold text-lg">이미 서명 완료되었습니다</p>
          <p className="text-green-100 text-sm mt-0.5">
            {permit.grade}급 — {permit.permit_type}
          </p>
        </div>
        <div className="bg-white px-6 py-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">성함</dt>
              <dd className="font-semibold text-gray-900">{worker.worker_name}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">서명 시간</dt>
              <dd className="text-gray-700">
                {worker.signed_at ? new Date(worker.signed_at).toLocaleString("ko-KR") : "-"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400 mt-4">이 창을 닫아도 됩니다.</p>
        </div>
      </div>
    );
  }

  if (screen === "done") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-blue-700 px-6 py-5">
          <p className="text-white font-bold text-lg">서명이 완료되었습니다</p>
          <p className="text-blue-200 text-sm mt-0.5">
            {permit.grade}급 — {permit.permit_type}
          </p>
        </div>
        <div className="bg-white px-6 py-6">
          <dl className="space-y-3 text-sm mb-5">
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">성함</dt>
              <dd className="font-semibold text-gray-900">{worker.worker_name}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">서명 시간</dt>
              <dd className="text-gray-700">{signedAt}</dd>
            </div>
            {permit.work_location && (
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">작업장소</dt>
                <dd className="text-gray-700">{permit.work_location}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-gray-400">
            작업허가서 서명이 완료되었습니다. 이 창을 닫아도 됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (screen === "sign") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            <span className="text-blue-700">{worker.worker_name}</span>님, 아래에 서명해 주세요.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            작업 전 체크리스트를 확인하였으며, 안전수칙을 준수하겠습니다.
          </p>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <SignaturePad onSave={handleSign} disabled={loading} />
        </div>
        <button
          onClick={() => setScreen("content")}
          className="w-full text-sm text-gray-400 hover:text-gray-600"
        >
          ← 허가서 내용 다시 보기
        </button>
      </div>
    );
  }

  // content screen
  return (
    <div className="space-y-4">
      {/* 본인 확인 */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-600 font-semibold">본인 확인</p>
        <p className="text-2xl font-bold text-blue-900 mt-1">{worker.worker_name}</p>
        <p className="text-xs text-blue-500 mt-0.5">
          본인이 맞으면 아래 내용을 확인하고 서명해 주세요.
        </p>
      </div>

      {/* 허가서 내용 */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          작업허가서 내용
        </p>
        <dl className="text-sm space-y-2 mb-4">
          <div className="flex gap-2">
            <dt className="text-gray-400 w-20 shrink-0">등급/유형</dt>
            <dd className="text-gray-800">{permit.grade}급 — {permit.permit_type}</dd>
          </div>
          {permit.work_name && (
            <div className="flex gap-2">
              <dt className="text-gray-400 w-20 shrink-0">작업명</dt>
              <dd className="text-gray-800">{permit.work_name}</dd>
            </div>
          )}
          {permit.work_location && (
            <div className="flex gap-2">
              <dt className="text-gray-400 w-20 shrink-0">작업장소</dt>
              <dd className="text-gray-800">{permit.work_location}</dd>
            </div>
          )}
          {permit.supervisor_name && (
            <div className="flex gap-2">
              <dt className="text-gray-400 w-20 shrink-0">관리감독자</dt>
              <dd className="text-gray-800">{permit.supervisor_name}</dd>
            </div>
          )}
        </dl>

        {/* 체크리스트 항목 (신청 항목만) */}
        {Object.keys(grouped).length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-2">
              ⚠️ 작업 전 확인 사항
            </p>
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, catItems]) => (
                <div key={category}>
                  <p className="text-[10px] font-bold text-amber-600 mb-1">{category}</p>
                  <ol className="text-xs text-amber-800 space-y-1">
                    {catItems.map((item, i) => (
                      <li key={i}>· {item.item_text}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setScreen("sign")}
        className="w-full py-5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-md active:scale-95 transition-transform"
      >
        내용 확인 완료 → 서명하기
      </button>
    </div>
  );
}
