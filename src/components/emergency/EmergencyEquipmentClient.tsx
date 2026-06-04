"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMERGENCY_EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES, equipmentStatusStyle, isInspectionDue } from "@/lib/emergency";
import type { EmergencyEquipment } from "@/types";

const BLANK = {
  equipment_name: "",
  category: "소화기",
  location: "",
  quantity: 1,
  status: "정상",
  last_inspected_at: "",
  next_inspection_date: "",
  inspector_name: "",
  note: "",
};

export default function EmergencyEquipmentClient({ initialEquipment }: { initialEquipment: EmergencyEquipment[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "add" | EmergencyEquipment>(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const list = initialEquipment;

  function openAdd() { setForm(BLANK); setError(""); setModal("add"); }
  function openEdit(e: EmergencyEquipment) {
    setForm({
      equipment_name: e.equipment_name,
      category: e.category,
      location: e.location,
      quantity: e.quantity,
      status: e.status,
      last_inspected_at: e.last_inspected_at ?? "",
      next_inspection_date: e.next_inspection_date ?? "",
      inspector_name: e.inspector_name ?? "",
      note: e.note ?? "",
    });
    setError("");
    setModal(e);
  }

  async function handleSave() {
    setError("");
    if (!form.equipment_name.trim() || !form.category || !form.location.trim()) {
      setError("장비명, 카테고리, 설치 위치는 필수입니다.");
      return;
    }
    setLoading(true);
    const isEdit = modal !== "add";
    const url = isEdit ? `/api/emergency/equipment/${(modal as EmergencyEquipment).id}` : "/api/emergency/equipment";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity) || 1,
        last_inspected_at: form.last_inspected_at || null,
        next_inspection_date: form.next_inspection_date || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(`저장 실패: ${d.detail ?? d.error ?? "오류"}`);
      return;
    }
    setModal(null);
    router.refresh();
  }

  async function toggleActive(e: EmergencyEquipment) {
    await fetch(`/api/emergency/equipment/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !e.active }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">+ 장비 등록</button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">등록된 비상장비가 없습니다.</p>
          <button onClick={openAdd} className="mt-3 text-sm text-blue-600 underline">장비 등록</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">장비명</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">카테고리</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">위치</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">수량</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">다음 점검</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((e) => (
                  <tr key={e.id} className={e.active ? "" : "opacity-40"}>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {e.equipment_name}
                      {e.note && <p className="text-xs text-gray-400 font-normal mt-0.5">{e.note}</p>}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{e.category}</td>
                    <td className="px-3 py-3 text-gray-600">{e.location}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{e.quantity}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${equipmentStatusStyle(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {e.next_inspection_date ? (
                        <span className={isInspectionDue(e.next_inspection_date) ? "text-amber-600 font-semibold" : ""}>
                          {e.next_inspection_date}
                          {isInspectionDue(e.next_inspection_date) && " ⚠"}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(e)} className="text-xs text-blue-600 hover:underline mr-3">수정</button>
                      <button onClick={() => toggleActive(e)} className="text-xs text-gray-500 hover:underline">{e.active ? "비활성화" : "활성화"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">{modal === "add" ? "비상장비 등록" : "비상장비 수정"}</h3>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">장비명 *</label>
                <input value={form.equipment_name} onChange={(e) => setForm((p) => ({ ...p, equipment_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리 *</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EMERGENCY_EQUIPMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">수량</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">설치 위치 *</label>
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="예: 1층 현관 / 작업장 입구"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">점검자</label>
                  <input value={form.inspector_name} onChange={(e) => setForm((p) => ({ ...p, inspector_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">최근 점검일</label>
                  <input type="date" value={form.last_inspected_at} onChange={(e) => setForm((p) => ({ ...p, last_inspected_at: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">다음 점검 예정일</label>
                  <input type="date" value={form.next_inspection_date} onChange={(e) => setForm((p) => ({ ...p, next_inspection_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">비고</label>
                <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl">
                  {loading ? "저장 중…" : "저장"}
                </button>
                <button onClick={() => setModal(null)} className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
