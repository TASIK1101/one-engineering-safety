"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Worksite } from "@/types";
import { INSPECTION_CATEGORIES } from "@/lib/inspection-categories";

type ConditionStatus = "양호" | "보통" | "불량";

type ItemState = {
  category: string;
  item_text: string;
  condition_status: ConditionStatus;
  issue_description: string;
  action_note: string;
  before_photo_url: string;
  assigned_to: string;
  due_date: string;
};

function buildInitialItems(): ItemState[] {
  const items: ItemState[] = [];
  for (const cat of INSPECTION_CATEGORIES) {
    for (const itemText of cat.items) {
      items.push({
        category: cat.category,
        item_text: itemText,
        condition_status: "양호",
        issue_description: "",
        action_note: "",
        before_photo_url: "",
        assigned_to: "",
        due_date: "",
      });
    }
  }
  return items;
}

export default function InspectionForm({ worksites }: { worksites: Worksite[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [inspectionDate, setInspectionDate] = useState(today);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionArea, setInspectionArea] = useState("");
  const [worksiteId, setWorksiteId] = useState("");
  const [items, setItems] = useState<ItemState[]>(buildInitialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function setCondition(index: number, status: ConditionStatus) {
    updateItem(index, {
      condition_status: status,
      // Clear bad fields when switching away from 불량
      ...(status !== "불량"
        ? {
            issue_description: "",
            action_note: "",
            before_photo_url: "",
            assigned_to: "",
            due_date: "",
          }
        : {}),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!inspectorName.trim()) {
      setError("점검자 이름을 입력해주세요.");
      return;
    }
    if (!inspectionArea.trim()) {
      setError("점검 구역을 입력해주세요.");
      return;
    }

    const badItems = items.filter((i) => i.condition_status === "불량");
    for (const item of badItems) {
      if (!item.issue_description.trim()) {
        setError(`'${item.item_text}' 항목의 불량 내용을 입력해주세요.`);
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        inspection_date: inspectionDate,
        inspector_name: inspectorName.trim(),
        inspection_area: inspectionArea.trim(),
        worksite_id: worksiteId || null,
        items: items.map((item) => ({
          category: item.category,
          item_text: item.item_text,
          condition_status: item.condition_status,
          issue_description: item.issue_description.trim() || null,
          action_note: item.action_note.trim() || null,
          before_photo_url: item.before_photo_url.trim() || null,
          assigned_to: item.assigned_to.trim() || null,
          due_date: item.due_date || null,
        })),
      };

      const res = await fetch("/api/inspections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/inspections/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  // Group items by category for rendering
  const grouped: { category: string; indices: number[] }[] = [];
  let currentCat = "";
  let currentGroup: number[] = [];
  items.forEach((item, idx) => {
    if (item.category !== currentCat) {
      if (currentGroup.length > 0) {
        grouped.push({ category: currentCat, indices: currentGroup });
      }
      currentCat = item.category;
      currentGroup = [idx];
    } else {
      currentGroup.push(idx);
    }
  });
  if (currentGroup.length > 0) {
    grouped.push({ category: currentCat, indices: currentGroup });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          기본 정보
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              점검일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              점검자 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="홍길동"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              점검 구역 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: A구역 1층"
              value={inspectionArea}
              onChange={(e) => setInspectionArea(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {worksites.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                현장 (선택)
              </label>
              <select
                value={worksiteId}
                onChange={(e) => setWorksiteId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">현장 선택 안함</option>
                {worksites.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.site_name}
                    {ws.project_name ? ` — ${ws.project_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 점검 항목 (카테고리별) */}
      {grouped.map(({ category, indices }) => {
        const catItems = indices.map((i) => items[i]);
        const goodCount = catItems.filter((i) => i.condition_status === "양호").length;
        const fairCount = catItems.filter((i) => i.condition_status === "보통").length;
        const badCount = catItems.filter((i) => i.condition_status === "불량").length;

        return (
          <section
            key={category}
            className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h2 className="text-sm font-semibold text-gray-700">{category}</h2>
              {goodCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">
                  양호 {goodCount}
                </span>
              )}
              {fairCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  보통 {fairCount}
                </span>
              )}
              {badCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
                  불량 {badCount}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {indices.map((idx) => {
                const item = items[idx];
                return (
                  <div key={idx} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-sm text-gray-800 flex-1 pt-1">{item.item_text}</p>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCondition(idx, "양호")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            item.condition_status === "양호"
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                          }`}
                        >
                          양호
                        </button>
                        <button
                          type="button"
                          onClick={() => setCondition(idx, "보통")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            item.condition_status === "보통"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                          }`}
                        >
                          보통
                        </button>
                        <button
                          type="button"
                          onClick={() => setCondition(idx, "불량")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            item.condition_status === "불량"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                          }`}
                        >
                          불량
                        </button>
                      </div>
                    </div>

                    {item.condition_status === "불량" && (
                      <div className="mt-3 pl-3 border-l-2 border-red-300 space-y-3 animate-in slide-in-from-top-1">
                        <div>
                          <label className="block text-xs font-semibold text-red-700 mb-1">
                            불량 내용 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="불량 내용을 구체적으로 입력하세요"
                            value={item.issue_description}
                            onChange={(e) =>
                              updateItem(idx, { issue_description: e.target.value })
                            }
                            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            조치 메모 (선택)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="즉시 조치 내용 또는 메모"
                            value={item.action_note}
                            onChange={(e) =>
                              updateItem(idx, { action_note: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            현황 사진 URL (선택)
                          </label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={item.before_photo_url}
                            onChange={(e) =>
                              updateItem(idx, { before_photo_url: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              담당자 (선택)
                            </label>
                            <input
                              type="text"
                              placeholder="담당자 이름"
                              value={item.assigned_to}
                              onChange={(e) =>
                                updateItem(idx, { assigned_to: e.target.value })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              조치 기한 (선택)
                            </label>
                            <input
                              type="date"
                              value={item.due_date}
                              onChange={(e) =>
                                updateItem(idx, { due_date: e.target.value })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex gap-3 pb-8">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
        >
          {loading ? "저장 중..." : "점검 저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
