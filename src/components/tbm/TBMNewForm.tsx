"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WORK_TYPES, DEFAULT_HAZARD_ITEMS } from "@/lib/tbm-work-types";
import type { Employee, Worksite } from "@/types";

interface Props {
  employees: Employee[];
  worksites: Worksite[];
}

export default function TBMNewForm({ employees, worksites }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ── 기본 정보 ──────────────────────────────────────────────
  const [date, setDate] = useState(today);
  const [company, setCompany] = useState("");
  const [worksiteId, setWorksiteId] = useState("");
  const [worksiteLocation, setWorksiteLocation] = useState("");
  const [workType, setWorkType] = useState("");
  const [processName, setProcessName] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [safetyManager, setSafetyManager] = useState("");
  const [siteManager, setSiteManager] = useState("");

  // ── 위험요인 ───────────────────────────────────────────────
  const [hazardItems, setHazardItems] = useState<string[]>([]);
  const [newHazardItem, setNewHazardItem] = useState("");

  // ── 특이사항 ───────────────────────────────────────────────
  const [mainHazardNotes, setMainHazardNotes] = useState("");
  const [accidentCaseNotes, setAccidentCaseNotes] = useState("");
  const [educationDone, setEducationDone] = useState(true);

  // ── 참석자 ─────────────────────────────────────────────────
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [customAttendeeName, setCustomAttendeeName] = useState("");
  const [customAttendees, setCustomAttendees] = useState<string[]>([]);

  // 공종 선택 시 기본 위험요인 자동 로드
  useEffect(() => {
    if (workType) {
      setHazardItems([...DEFAULT_HAZARD_ITEMS]);
    }
  }, [workType]);

  // worksite 선택 시 location 자동 채우기
  const handleWorksiteChange = (id: string) => {
    setWorksiteId(id);
    if (id) {
      const ws = worksites.find((w) => w.id === id);
      setWorksiteLocation(ws?.location ?? ws?.site_name ?? "");
    } else {
      setWorksiteLocation("");
    }
  };

  // ── 참석자 헬퍼 ────────────────────────────────────────────
  const allEmployeeNames = employees.map((e) => e.name);

  const toggleAttendee = (name: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    const all = [...allEmployeeNames, ...customAttendees];
    setSelectedAttendees(all);
  };

  const clearAll = () => setSelectedAttendees([]);

  const addCustomAttendee = () => {
    const name = customAttendeeName.trim();
    if (!name) return;
    if (!customAttendees.includes(name) && !employees.find((e) => e.name === name)) {
      setCustomAttendees((prev) => [...prev, name]);
    }
    if (!selectedAttendees.includes(name)) {
      setSelectedAttendees((prev) => [...prev, name]);
    }
    setCustomAttendeeName("");
  };

  // ── 위험요인 헬퍼 ──────────────────────────────────────────
  const removeHazardItem = (idx: number) =>
    setHazardItems((prev) => prev.filter((_, i) => i !== idx));

  const addHazardItem = () => {
    const item = newHazardItem.trim();
    if (!item) return;
    setHazardItems((prev) => [...prev, item]);
    setNewHazardItem("");
  };

  // ── 저장 ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !workType) {
      setError("날짜와 공종은 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tbm/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          company,
          worksite_location: worksiteLocation,
          work_type: workType,
          process_name: processName,
          supervisor,
          safety_manager: safetyManager,
          site_manager: siteManager,
          hazard_items: hazardItems,
          main_hazard_notes: mainHazardNotes,
          accident_case_notes: accidentCaseNotes,
          education_done: educationDone,
          attendee_names: selectedAttendees,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error === "unauthorized"
            ? "로그인이 필요합니다."
            : data?.error === "insert_failed"
              ? "DB 저장 중 오류가 발생했습니다. 테이블이 생성되었는지 확인해 주세요."
              : `저장 오류: ${data?.error ?? res.status}`;
        setError(msg);
        setLoading(false);
        return;
      }

      router.push(`/tbm/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  // ── 렌더 ───────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">새 TBM 작성</h1>
        <p className="text-sm text-gray-500 mt-1">
          작업 전 위험성평가 교육 내용을 작성합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── 기본 정보 ── */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            📋 기본 정보
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="작성일 *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="협력사명"
              type="text"
              placeholder="주식회사 원엔지니어링"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />

            {/* 작업장 — DB에 worksites가 있으면 드롭다운, 없으면 텍스트 */}
            {worksites.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작업장
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={worksiteId}
                  onChange={(e) => handleWorksiteChange(e.target.value)}
                >
                  <option value="">작업장 선택</option>
                  {worksites.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.site_name}
                      {ws.location ? ` (${ws.location})` : ""}
                    </option>
                  ))}
                  <option value="__custom__">직접 입력</option>
                </select>
              </div>
            ) : null}

            {/* 위치 직접 입력 (worksites 없거나 '직접 입력' 선택 시) */}
            {(worksites.length === 0 || worksiteId === "__custom__") && (
              <Input
                label="작업장 위치"
                type="text"
                placeholder="예: 2도크 선미 구역"
                value={worksiteLocation}
                onChange={(e) => setWorksiteLocation(e.target.value)}
              />
            )}

            {/* 공종 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공종 *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                required
              >
                <option value="">공종 선택</option>
                {WORK_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>
                    {wt.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="세부 공정명"
              type="text"
              placeholder="예: 철판 절단 및 용접"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
            />
            <Input
              label="실시자 (직반장)"
              type="text"
              placeholder="홍길동"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
            />
            <Input
              label="안전전담자"
              type="text"
              placeholder="김안전"
              value={safetyManager}
              onChange={(e) => setSafetyManager(e.target.value)}
            />
            <Input
              label="소장/대표"
              type="text"
              placeholder="이대표"
              value={siteManager}
              onChange={(e) => setSiteManager(e.target.value)}
            />
          </div>
        </section>

        {/* ── 위험요인 및 안전대책 ── */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3 pb-3 border-b border-gray-100">
            ⚠️ 위험요인 및 안전대책
          </h2>
          {workType ? (
            <>
              <p className="text-xs text-gray-400 mb-4">
                공종 &quot;{workType}&quot; 기본 항목이 불러와졌습니다. 항목을
                수정·추가할 수 있습니다.
              </p>
              <ul className="space-y-2 mb-4">
                {hazardItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  >
                    <span className="text-amber-600 font-bold text-sm shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="text-sm text-gray-800 flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeHazardItem(idx)}
                      className="text-gray-300 hover:text-red-400 text-xs shrink-0 px-1"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="위험요인 항목 직접 추가"
                  value={newHazardItem}
                  onChange={(e) => setNewHazardItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHazardItem();
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addHazardItem}
                >
                  추가
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">
                공종을 선택하면 기본 위험요인이 자동으로 불러와집니다.
              </p>
            </div>
          )}
        </section>

        {/* ── 당일 특이사항 ── */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            📝 당일 특이사항
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                당일 주요 유해위험 전달사항
              </label>
              <textarea
                rows={3}
                placeholder="오늘 특별히 주의해야 할 유해위험 요소를 입력하세요."
                value={mainHazardNotes}
                onChange={(e) => setMainHazardNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사고사례 전파 내용
              </label>
              <textarea
                rows={3}
                placeholder="관련 사고사례 또는 아차사고 사례를 입력하세요."
                value={accidentCaseNotes}
                onChange={(e) => setAccidentCaseNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={educationDone}
                onChange={(e) => setEducationDone(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                교육 실시 완료
              </span>
            </label>
          </div>
        </section>

        {/* ── 참석자 선택 ── */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              👥 참석자 선택
            </h2>
            {employees.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  전체 선택
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  전체 해제
                </button>
              </div>
            )}
          </div>

          {employees.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {employees.map((emp) => {
                const selected = selectedAttendees.includes(emp.name);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleAttendee(emp.name)}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                      selected
                        ? "bg-blue-50 border-blue-400 text-blue-800"
                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-200"
                    }`}
                  >
                    <span className="font-medium text-sm">{emp.name}</span>
                    {emp.department && (
                      <span className="text-xs text-gray-400">
                        {emp.department}
                      </span>
                    )}
                    {selected && (
                      <span className="text-xs text-blue-600 mt-0.5">
                        ✓ 선택됨
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4 bg-gray-50 rounded-lg px-3 py-3">
              등록된 직원이 없습니다.{" "}
              <a href="/employees/new" className="text-blue-600 hover:underline">
                직원 등록 →
              </a>
            </p>
          )}

          {/* 외부 작업자 직접 입력 */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="이름 직접 입력 (외부 작업자 등)"
              value={customAttendeeName}
              onChange={(e) => setCustomAttendeeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAttendee();
                }
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addCustomAttendee}
            >
              추가
            </Button>
          </div>

          {/* 선택된 참석자 요약 */}
          {selectedAttendees.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                선택된 참석자 ({selectedAttendees.length}명)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleAttendee(name)}
                      className="text-blue-300 hover:text-red-400 ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              참석자를 선택하지 않아도 저장할 수 있습니다.
            </p>
          )}
        </section>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 justify-end pb-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            TBM 저장 및 서명 시작
          </Button>
        </div>
      </form>
    </div>
  );
}
