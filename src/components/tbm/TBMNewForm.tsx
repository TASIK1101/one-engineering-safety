"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WORK_TYPES, DEFAULT_HAZARD_ITEMS } from "@/lib/tbm-work-types";
import type { Employee } from "@/types";

interface Props {
  employees: Employee[];
}

export default function TBMNewForm({ employees }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [company, setCompany] = useState("");
  const [worksiteLocation, setWorksiteLocation] = useState("");
  const [workType, setWorkType] = useState("");
  const [processName, setProcessName] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [safetyManager, setSafetyManager] = useState("");
  const [siteManager, setSiteManager] = useState("");
  const [hazardItems, setHazardItems] = useState<string[]>([]);
  const [mainHazardNotes, setMainHazardNotes] = useState("");
  const [accidentCaseNotes, setAccidentCaseNotes] = useState("");
  const [educationDone, setEducationDone] = useState(true);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [customAttendeeName, setCustomAttendeeName] = useState("");
  const [customAttendees, setCustomAttendees] = useState<string[]>([]);
  const [newHazardItem, setNewHazardItem] = useState("");

  // 공종 선택 시 기본 위험요인 불러오기
  useEffect(() => {
    if (workType) {
      setHazardItems([...DEFAULT_HAZARD_ITEMS]);
    }
  }, [workType]);

  const toggleAttendee = (name: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

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

  const removeHazardItem = (idx: number) => {
    setHazardItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addHazardItem = () => {
    const item = newHazardItem.trim();
    if (!item) return;
    setHazardItems((prev) => [...prev, item]);
    setNewHazardItem("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !workType) {
      setError("날짜와 공종은 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");

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
      setError("저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    router.push(`/tbm/${data.id}`);
  }

  return (
    <div>
      <div className="mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">새 TBM 작성</h1>
        <p className="text-sm text-gray-500 mt-1">
          작업 전 위험성평가 교육 내용을 작성합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
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
            <Input
              label="작업장 위치"
              type="text"
              placeholder="예: 2도크 선미 구역"
              value={worksiteLocation}
              onChange={(e) => setWorksiteLocation(e.target.value)}
            />
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

        {/* 위험요인 및 안전대책 */}
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
                      className="text-gray-400 hover:text-red-500 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="위험요인 항목 추가"
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
                <Button type="button" variant="secondary" onClick={addHazardItem}>
                  추가
                </Button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">
              공종을 선택하면 기본 위험요인이 자동으로 불러와집니다.
            </p>
          )}
        </section>

        {/* 당일 특이사항 */}
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

        {/* 참석자 선택 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            👥 참석자 선택
          </h2>
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
                      <span className="text-xs text-blue-600 mt-1">
                        ✓ 선택됨
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">
              등록된 직원이 없습니다. 아래에서 이름을 직접 입력하세요.
            </p>
          )}

          {/* 이름 직접 입력 */}
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
            <Button type="button" variant="secondary" onClick={addCustomAttendee}>
              추가
            </Button>
          </div>

          {/* 선택된 참석자 요약 */}
          {selectedAttendees.length > 0 && (
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
                      className="text-blue-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
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
