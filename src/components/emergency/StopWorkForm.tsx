"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmergencyFileUpload from "@/components/emergency/EmergencyFileUpload";

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StopWorkForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    occurred_at: nowLocal(),
    worksite_location: "",
    work_type: "",
    reporter_name: "",
    stop_reason: "",
    hazard_description: "",
    immediate_action: "",
    corrective_action: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.occurred_at || !form.worksite_location.trim() || !form.reporter_name.trim() || !form.stop_reason.trim()) {
      setError("발생 일시, 작업장 위치, 신고자, 작업중지 사유는 필수입니다.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/emergency/stop-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        occurred_at: new Date(form.occurred_at).toISOString(),
        photo_urls: photos,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(`등록 실패: ${data.detail ?? data.error ?? "오류"}`);
      return;
    }
    router.push(`/emergency/stop-work/${data.id}`);
    router.refresh();
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">발생 일시 *</label>
          <input type="datetime-local" value={form.occurred_at} onChange={(e) => upd("occurred_at", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">신고자 *</label>
          <input value={form.reporter_name} onChange={(e) => upd("reporter_name", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">작업장 위치 *</label>
          <input value={form.worksite_location} onChange={(e) => upd("worksite_location", e.target.value)} placeholder="예: 2공구 교량 상부" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">작업 유형</label>
          <input value={form.work_type} onChange={(e) => upd("work_type", e.target.value)} placeholder="예: 고소작업 / 굴착" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">작업중지 사유 *</label>
        <textarea value={form.stop_reason} onChange={(e) => upd("stop_reason", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">발견 위험요인</label>
        <textarea value={form.hazard_description} onChange={(e) => upd("hazard_description", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">즉시 조치</label>
        <textarea value={form.immediate_action} onChange={(e) => upd("immediate_action", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">개선 조치</label>
        <textarea value={form.corrective_action} onChange={(e) => upd("corrective_action", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">현장 사진</label>
        <EmergencyFileUpload folder="stop-work" value={photos} onChange={setPhotos} disabled={loading} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300">
          {loading ? "등록 중…" : "작업중지 등록"}
        </button>
        <button type="button" onClick={() => router.back()} disabled={loading} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
      </div>
    </form>
  );
}
