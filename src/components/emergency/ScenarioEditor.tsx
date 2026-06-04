"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIO_SECTIONS } from "@/lib/emergency";
import type { EmergencyScenario } from "@/types";

type ArrayKey =
  | "initial_response"
  | "evacuation_actions"
  | "rescue_actions"
  | "hazard_removal_actions"
  | "secondary_damage_prevention"
  | "reporting_actions"
  | "role_assignments";

export default function ScenarioEditor({ scenario }: { scenario: EmergencyScenario }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(scenario.title);
  const [overview, setOverview] = useState(scenario.overview ?? "");
  const [sections, setSections] = useState<Record<ArrayKey, string[]>>({
    initial_response: scenario.initial_response ?? [],
    evacuation_actions: scenario.evacuation_actions ?? [],
    rescue_actions: scenario.rescue_actions ?? [],
    hazard_removal_actions: scenario.hazard_removal_actions ?? [],
    secondary_damage_prevention: scenario.secondary_damage_prevention ?? [],
    reporting_actions: scenario.reporting_actions ?? [],
    role_assignments: scenario.role_assignments ?? [],
  });

  function updateItem(key: ArrayKey, idx: number, val: string) {
    setSections((p) => ({ ...p, [key]: p[key].map((x, i) => (i === idx ? val : x)) }));
  }
  function addItem(key: ArrayKey) {
    setSections((p) => ({ ...p, [key]: [...p[key], ""] }));
  }
  function removeItem(key: ArrayKey, idx: number) {
    setSections((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  }

  async function save() {
    setError("");
    setLoading(true);
    const cleaned: Record<string, string[]> = {};
    (Object.keys(sections) as ArrayKey[]).forEach((k) => {
      cleaned[k] = sections[k].map((s) => s.trim()).filter(Boolean);
    });
    const res = await fetch(`/api/emergency/scenarios/${scenario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), overview: overview.trim() || null, ...cleaned }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(`저장 실패: ${d.detail ?? d.error ?? "오류"}`);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">{scenario.scenario_type}</span>
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
            ) : (
              <h1 className="mt-2 text-xl font-bold text-gray-900">{scenario.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {!editing ? (
              <>
                <a href={`/emergency/scenarios/${scenario.id}?print=1`} className="hidden" aria-hidden />
                <button onClick={() => setEditing(true)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">수정</button>
                <button onClick={() => window.print()} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">🖨️ 인쇄</button>
              </>
            ) : (
              <>
                <button onClick={save} disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">{loading ? "저장 중…" : "저장"}</button>
                <button onClick={() => { setEditing(false); router.refresh(); }} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">취소</button>
              </>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">상황 개요</p>
          {editing ? (
            <textarea value={overview} onChange={(e) => setOverview(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ) : (
            <p className="text-sm text-gray-700">{scenario.overview || "-"}</p>
          )}
        </div>
      </div>

      {/* 섹션들 */}
      {SCENARIO_SECTIONS.map(({ key, label }) => {
        const k = key as ArrayKey;
        const items = sections[k];
        return (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {label}
            </h2>
            {editing ? (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-xs text-gray-400 pt-2.5 w-5 text-right">{idx + 1}.</span>
                    <input value={item} onChange={(e) => updateItem(k, idx, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => removeItem(k, idx)} className="text-gray-400 hover:text-red-600 px-2">×</button>
                  </div>
                ))}
                <button onClick={() => addItem(k)} className="text-sm text-blue-600 hover:underline">+ 항목 추가</button>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 내용이 없습니다.</p>
            ) : (
              <ol className="space-y-1.5">
                {items.map((item, idx) => {
                  const isPlaceholder = item.includes("[수정 필요]") || item.includes("입력 필요") || item.includes("지정 필요");
                  return (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
                      <span className={isPlaceholder ? "text-amber-600" : "text-gray-700"}>{item}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}
