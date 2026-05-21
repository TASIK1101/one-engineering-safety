"use client";

import { useState } from "react";
import SignaturePad from "@/components/tbm/SignaturePad";
import type { TbmRecord, TbmAttendee } from "@/types";

interface Props {
  tbm: TbmRecord;
  attendee: TbmAttendee;
}

type Screen = "content" | "sign" | "done" | "already_done";

export default function TBMSignForm({ tbm, attendee }: Props) {
  const [screen, setScreen] = useState<Screen>(
    attendee.attendance_status === "서명완료" ? "already_done" : "content"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedAt, setSignedAt] = useState<string | null>(null);

  async function handleSign(dataUrl: string) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tbm/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendeeId: attendee.id,
        signatureData: dataUrl,
      }),
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

  if (screen === "already_done") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-green-600 px-6 py-5">
          <p className="text-white font-bold text-lg">이미 서명 완료되었습니다</p>
          <p className="text-green-100 text-sm mt-0.5">
            {tbm.date} {tbm.work_type} TBM
          </p>
        </div>
        <div className="bg-white px-6 py-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">성함</dt>
              <dd className="font-semibold text-gray-900">
                {attendee.employee_name}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">서명 시간</dt>
              <dd className="text-gray-700">
                {attendee.signed_at
                  ? new Date(attendee.signed_at).toLocaleString("ko-KR")
                  : "-"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400 mt-4">
            서명이 정상적으로 완료되었습니다. 이 창을 닫아도 됩니다.
          </p>
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
            {tbm.date} {tbm.work_type} TBM
          </p>
        </div>
        <div className="bg-white px-6 py-6">
          <dl className="space-y-3 text-sm mb-5">
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">성함</dt>
              <dd className="font-semibold text-gray-900">
                {attendee.employee_name}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">서명 시간</dt>
              <dd className="text-gray-700">{signedAt}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">공종</dt>
              <dd className="text-gray-700">
                {tbm.work_type}
                {tbm.process_name ? ` — ${tbm.process_name}` : ""}
              </dd>
            </div>
            {tbm.worksite_location && (
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">작업장</dt>
                <dd className="text-gray-700">{tbm.worksite_location}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-gray-400">
            TBM 교육 이수 서명이 완료되었습니다. 이 창을 닫아도 됩니다.
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
            <span className="text-blue-700">{attendee.employee_name}</span>님,
            아래에 서명해 주세요.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            위 TBM 교육 내용을 확인하였으며, 안전수칙을 준수하겠습니다.
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
          ← 교육 내용 다시 보기
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
        <p className="text-2xl font-bold text-blue-900 mt-1">
          {attendee.employee_name}
        </p>
        <p className="text-xs text-blue-500 mt-0.5">
          본인이 맞으면 아래 내용을 확인하고 서명해 주세요.
        </p>
      </div>

      {/* TBM 내용 */}
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
            <p className="text-xs font-semibold text-amber-700 mb-2">
              ⚠️ 위험요인 및 안전대책
            </p>
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
        내용 확인 완료 → 서명하기
      </button>
    </div>
  );
}
