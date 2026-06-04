"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMERGENCY_CONTACT_TYPES } from "@/lib/emergency";
import type { EmergencyContact } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  사내: "bg-blue-100 text-blue-700",
  원청: "bg-purple-100 text-purple-700",
  소방: "bg-red-100 text-red-700",
  경찰: "bg-slate-100 text-slate-700",
  병원: "bg-green-100 text-green-700",
  기타: "bg-gray-100 text-gray-600",
};

const BLANK = {
  contact_type: "사내",
  organization_name: "",
  contact_name: "",
  phone: "",
  secondary_phone: "",
  description: "",
  display_order: 0,
};

export default function EmergencyContactsClient({ initialContacts }: { initialContacts: EmergencyContact[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "add" | EmergencyContact>(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contacts = initialContacts;

  function openAdd() {
    setForm({ ...BLANK, display_order: contacts.length });
    setError("");
    setModal("add");
  }
  function openEdit(c: EmergencyContact) {
    setForm({
      contact_type: c.contact_type,
      organization_name: c.organization_name,
      contact_name: c.contact_name ?? "",
      phone: c.phone,
      secondary_phone: c.secondary_phone ?? "",
      description: c.description ?? "",
      display_order: c.display_order,
    });
    setError("");
    setModal(c);
  }

  async function handleSave() {
    setError("");
    if (!form.organization_name.trim() || !form.phone.trim()) {
      setError("기관명과 전화번호는 필수입니다.");
      return;
    }
    setLoading(true);
    const isEdit = modal !== "add";
    const url = isEdit ? `/api/emergency/contacts/${(modal as EmergencyContact).id}` : "/api/emergency/contacts";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, display_order: Number(form.display_order) || 0 }),
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

  async function toggleActive(c: EmergencyContact) {
    await fetch(`/api/emergency/contacts/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    router.refresh();
  }

  async function move(c: EmergencyContact, dir: -1 | 1) {
    const sorted = [...contacts].sort((a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at));
    const idx = sorted.findIndex((x) => x.id === c.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/emergency/contacts/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ display_order: swapWith.display_order }) }),
      fetch(`/api/emergency/contacts/${swapWith.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ display_order: c.display_order }) }),
    ]);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">+ 연락처 추가</button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">등록된 비상연락처가 없습니다.</p>
          <button onClick={openAdd} className="mt-3 text-sm text-blue-600 underline">연락처 추가</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-16">순서</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">유형</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">기관명</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">담당자</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">전화번호</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c.id} className={c.active ? "" : "opacity-40"}>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => move(c, -1)} className="text-gray-400 hover:text-gray-700 text-xs leading-none">▲</button>
                        <button onClick={() => move(c, 1)} className="text-gray-400 hover:text-gray-700 text-xs leading-none">▼</button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[c.contact_type] ?? TYPE_COLORS["기타"]}`}>{c.contact_type}</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {c.organization_name}
                      {c.description && <p className="text-xs text-gray-400 font-normal mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{c.contact_name ?? "-"}</td>
                    <td className="px-3 py-3">
                      <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline font-mono">{c.phone}</a>
                      {c.secondary_phone && <span className="text-gray-400 text-xs ml-1 block">{c.secondary_phone}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${c.active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {c.active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(c)} className="text-xs text-blue-600 hover:underline mr-3">수정</button>
                      <button onClick={() => toggleActive(c)} className="text-xs text-gray-500 hover:underline">{c.active ? "비활성화" : "활성화"}</button>
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
              <h3 className="text-base font-bold text-gray-900">{modal === "add" ? "연락처 추가" : "연락처 수정"}</h3>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">유형 *</label>
                  <select value={form.contact_type} onChange={(e) => setForm((p) => ({ ...p, contact_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EMERGENCY_CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">표시 순서</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">기관명 *</label>
                <input value={form.organization_name} onChange={(e) => setForm((p) => ({ ...p, organization_name: e.target.value }))}
                  placeholder="예: 관할 소방서 / 인근 병원 / 원청 안전팀"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">담당자명</label>
                  <input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">전화번호 *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="예: 02-000-0000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">보조 전화번호</label>
                <input type="tel" value={form.secondary_phone} onChange={(e) => setForm((p) => ({ ...p, secondary_phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">설명</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
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
