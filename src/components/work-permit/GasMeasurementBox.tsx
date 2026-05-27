"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkPermitGasMeasurement } from "@/types";

interface Props {
  permitId: string;
  measurements: WorkPermitGasMeasurement[];
  isLocked: boolean;
}

export default function GasMeasurementBox({ permitId, measurements, isLocked }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    oxygen: "",
    combustible_gas: "",
    carbon_monoxide: "",
    measured_by: "",
    measured_at: new Date().toISOString().slice(0, 16),
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/work-permits/add-gas-measurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permitId,
        oxygen: form.oxygen ? parseFloat(form.oxygen) : undefined,
        combustible_gas: form.combustible_gas ? parseFloat(form.combustible_gas) : undefined,
        carbon_monoxide: form.carbon_monoxide ? parseFloat(form.carbon_monoxide) : undefined,
        measured_by: form.measured_by || undefined,
        measured_at: new Date(form.measured_at).toISOString(),
      }),
    });
    if (!res.ok) {
      setError("저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    setShowForm(false);
    setForm({
      oxygen: "",
      combustible_gas: "",
      carbon_monoxide: "",
      measured_by: "",
      measured_at: new Date().toISOString().slice(0, 16),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="rounded-xl bg-white border border-blue-100 p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          🧪 가스 농도 측정 기록
        </h2>
        {!isLocked && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50 transition-colors"
          >
            {showForm ? "닫기" : "+ 측정값 추가"}
          </button>
        )}
      </div>

      {/* 기준값 안내 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
          산소 18~23.5%
        </span>
        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100">
          가연성가스 LEL 10% 이하
        </span>
        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-100">
          CO 25ppm 이하
        </span>
      </div>

      {/* 측정 기록 테이블 */}
      {measurements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1.5 text-left text-gray-600 font-medium">측정 시각</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center text-gray-600 font-medium">산소(%)</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center text-gray-600 font-medium">가연성가스(%LEL)</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center text-gray-600 font-medium">CO(ppm)</th>
                <th className="border border-gray-200 px-2 py-1.5 text-left text-gray-600 font-medium">측정자</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1.5">
                    {new Date(m.measured_at).toLocaleString("ko-KR", {
                      month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${
                    m.oxygen !== null && (m.oxygen < 18 || m.oxygen > 23.5)
                      ? "text-red-600 bg-red-50"
                      : "text-green-700"
                  }`}>
                    {m.oxygen ?? "-"}
                  </td>
                  <td className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${
                    m.combustible_gas !== null && m.combustible_gas > 10
                      ? "text-red-600 bg-red-50"
                      : "text-green-700"
                  }`}>
                    {m.combustible_gas ?? "-"}
                  </td>
                  <td className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${
                    m.carbon_monoxide !== null && m.carbon_monoxide > 25
                      ? "text-red-600 bg-red-50"
                      : "text-green-700"
                  }`}>
                    {m.carbon_monoxide ?? "-"}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">{m.measured_by ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">측정 기록이 없습니다.</p>
      )}

      {/* 측정값 추가 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">새 측정값 입력</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">산소 (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.oxygen}
                onChange={(e) => handleChange("oxygen", e.target.value)}
                placeholder="20.9"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">가연성가스 (%LEL)</label>
              <input
                type="number"
                step="0.1"
                value={form.combustible_gas}
                onChange={(e) => handleChange("combustible_gas", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">CO (ppm)</label>
              <input
                type="number"
                step="0.1"
                value={form.carbon_monoxide}
                onChange={(e) => handleChange("carbon_monoxide", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">측정자</label>
              <input
                type="text"
                value={form.measured_by}
                onChange={(e) => handleChange("measured_by", e.target.value)}
                placeholder="김안전"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">측정 시각</label>
            <input
              type="datetime-local"
              value={form.measured_at}
              onChange={(e) => handleChange("measured_at", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {loading ? "저장 중…" : "저장"}
          </button>
        </form>
      )}
    </section>
  );
}
