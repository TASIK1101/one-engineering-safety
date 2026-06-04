"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmergencyFileUpload from "@/components/emergency/EmergencyFileUpload";
import { DRILL_TYPES, DRILL_RESULT_STATUSES } from "@/lib/emergency";

interface EmployeeOpt {
  id: string;
  name: string;
  department: string | null;
}
interface ScenarioOpt {
  id: string;
  scenario_type: string;
  title: string;
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EmergencyDrillForm({
  employees,
  scenarios,
}: {
  employees: EmployeeOpt[];
  scenarios: ScenarioOpt[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    drill_date: todayStr(),
    scenario_id: "",
    drill_type: DRILL_TYPES[0] as string,
    location: "",
    supervisor_name: "",
    summary: "",
    issues_found: "",
    improvement_actions: "",
    result_status: "작성중" as string,
    approved_by: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [empQuery, setEmpQuery] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function toggleEmp(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(q) || (e.department ?? "").toLowerCase().includes(q));
  }, [empQuery, employees]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.drill_date || !form.drill_type || !form.location.trim()) {
      setError("훈련일, 훈련 유형, 장소는 필수입니다.");
      return;
    }
    setLoading(true);
    const attendees = employees
      .filter((emp) => selectedIds.has(emp.id))
      .map((emp) => ({ employee_id: emp.id, employee_name: emp.name, attended: true }));

    const res = await fetch("/api/emergency/drills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        scenario_id: form.scenario_id || null,
        approved_by: form.approved_by.trim() || null,
        approved_at: form.result_status === "완료" && form.approved_by.trim() ? new Date().toISOString() : null,
        photo_urls: photos,
        attendees,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(`등록 실패: ${data.detail ?? data.error ?? "오류"}`);
      return;
    }
    router.push(`/emergency/drills/${data.id}`);
    router.refresh();
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">훈련일 *</label>
          <input type="date" value={form.drill_date} onChange={(e) => upd("drill_date", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">훈련 유형 *</label>
          <select value={form.drill_type} onChange={(e) => upd("drill_type", e.target.value)} className={inputCls}>
            {DRILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">장소 *</label>
          <input value={form.location} onChange={(e) => upd("location", e.target.value)} placeholder="예: 본사 주차장 / 현장 집결지" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
          <input value={form.supervisor_name} onChange={(e) => upd("supervisor_name", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연계 시나리오</label>
        <select value={form.scenario_id} onChange={(e) => upd("scenario_id", e.target.value)} className={inputCls}>
          <option value="">선택 안 함</option>
          {scenarios.map((s) => <option key={s.id} value={s.id}>[{s.scenario_type}] {s.title}</option>)}
        </select>
      </div>

      {/* 참석자 다중 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">참석 직원 ({selectedIds.size}명 선택됨)</label>
        <input value={empQuery} onChange={(e) => setEmpQuery(e.target.value)} placeholder="이름 또는 부서로 검색" className={`${inputCls} mb-2`} />
        {employees.length === 0 ? (
          <p className="text-xs text-amber-600">등록된 교육 대상자가 없습니다.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredEmployees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                <input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleEmp(emp.id)} className="rounded" />
                <span className="text-gray-800">{emp.name}</span>
                {emp.department && <span className="text-xs text-gray-400">({emp.department})</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">실시 개요</label>
        <textarea value={form.summary} onChange={(e) => upd("summary", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">발견 문제점</label>
        <textarea value={form.issues_found} onChange={(e) => upd("issues_found", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">개선 조치</label>
        <textarea value={form.improvement_actions} onChange={(e) => upd("improvement_actions", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">현장 사진</label>
        <EmergencyFileUpload folder="drills" value={photos} onChange={setPhotos} disabled={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select value={form.result_status} onChange={(e) => upd("result_status", e.target.value)} className={inputCls}>
            {DRILL_RESULT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">승인자 (완료 시)</label>
          <input value={form.approved_by} onChange={(e) => upd("approved_by", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
          {loading ? "등록 중…" : "훈련 등록"}
        </button>
        <button type="button" onClick={() => router.back()} disabled={loading} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
      </div>
    </form>
  );
}
