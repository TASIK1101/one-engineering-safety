"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Employee, WorkPermitTemplate } from "@/types";
import { getPermitTypes, isConfinedSpace } from "@/lib/work-permit-types";
import type { PermitGrade } from "@/lib/work-permit-types";

interface ChecklistItem {
  category: string;
  item_text: string;
  apply_status: "신청" | "해당없음";
}

interface WorkerEntry {
  employee_id: string | null;
  worker_name: string;
  phone_last4?: string;
  company_name?: string;
  is_manual?: boolean;
}

interface Props {
  employees: Employee[];
  templates: WorkPermitTemplate[];
}

export default function WorkPermitNewForm({ employees, templates }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: 등급 + 유형 ─────────────────────────────────────
  const [grade, setGrade] = useState<PermitGrade | "">("");
  const [permitType, setPermitType] = useState("");

  // ── 기본 정보 ───────────────────────────────────────────────
  const [workCompany, setWorkCompany] = useState("");
  const [workDepartment, setWorkDepartment] = useState("");
  const [workPeriodStart, setWorkPeriodStart] = useState("");
  const [workPeriodEnd, setWorkPeriodEnd] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [workName, setWorkName] = useState("");
  const [workerCount, setWorkerCount] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // ── 밀폐구역 전용 ────────────────────────────────────────────
  const [ventilationMethod, setVentilationMethod] = useState("");
  const [watcherName, setWatcherName] = useState("");

  // ── 체크리스트 ───────────────────────────────────────────────
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // ── 전자승인 담당자 ──────────────────────────────────────────
  const [authorEmployeeId, setAuthorEmployeeId] = useState("");
  const [safetyManagerEmployeeId, setSafetyManagerEmployeeId] = useState("");
  const [representativeEmployeeId, setRepresentativeEmployeeId] = useState("");

  // ── 작업 인원 ────────────────────────────────────────────────
  const [selectedWorkers, setSelectedWorkers] = useState<WorkerEntry[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompany, setManualCompany] = useState("");

  // ── 등급 선택 ────────────────────────────────────────────────
  function handleGradeSelect(g: PermitGrade) {
    setGrade(g);
    setPermitType("");
    setChecklistItems([]);
  }

  // ── 유형 선택 + 템플릿 로드 ──────────────────────────────────
  function handleTypeSelect(type: string) {
    setPermitType(type);
    const tpl = templates.find((t) => t.grade === grade && t.permit_type === type);
    if (tpl) {
      setChecklistItems(
        tpl.checklist_items.map((ci) => ({
          category: ci.category,
          item_text: ci.item_text,
          apply_status: "신청",
        }))
      );
    } else {
      setChecklistItems([]);
    }
  }

  // ── 체크리스트 항목 토글 ──────────────────────────────────────
  function toggleItemStatus(idx: number) {
    setChecklistItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, apply_status: item.apply_status === "신청" ? "해당없음" : "신청" }
          : item
      )
    );
  }

  // ── 작업 인원 관련 ───────────────────────────────────────────
  function toggleEmployee(emp: Employee) {
    const exists = selectedWorkers.some((w) => w.employee_id === emp.id);
    if (exists) {
      setSelectedWorkers((prev) => prev.filter((w) => w.employee_id !== emp.id));
    } else {
      setSelectedWorkers((prev) => [...prev, { employee_id: emp.id, worker_name: emp.name }]);
    }
  }

  function addManualWorker() {
    const name = manualName.trim();
    const phone = manualPhone.replace(/\D/g, "").slice(0, 4);
    if (!name || phone.length !== 4) return;
    if (selectedWorkers.some((w) => w.is_manual && w.worker_name === name)) return;
    setSelectedWorkers((prev) => [
      ...prev,
      {
        employee_id: null,
        worker_name: name,
        phone_last4: phone,
        company_name: manualCompany.trim() || undefined,
        is_manual: true,
      },
    ]);
    setManualName("");
    setManualPhone("");
    setManualCompany("");
  }

  function removeWorker(idx: number) {
    setSelectedWorkers((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── 카테고리별 그룹핑 ─────────────────────────────────────────
  const groupedItems = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    checklistItems.forEach((item) => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [checklistItems]);

  const showConfinedSpace = permitType ? isConfinedSpace(permitType) : false;
  const formReady = grade && permitType;

  // ── 제출 ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!grade || !permitType) {
      setError("등급과 허가 유형을 선택해 주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/work-permits/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade,
        permit_type: permitType,
        work_company: workCompany,
        work_department: workDepartment,
        work_period_start: workPeriodStart || null,
        work_period_end: workPeriodEnd || null,
        work_location: workLocation,
        work_name: workName,
        worker_count: workerCount ? parseInt(workerCount) : null,
        supervisor_name: supervisorName,
        emergency_contact: emergencyContact,
        ventilation_method: showConfinedSpace ? ventilationMethod : undefined,
        watcher_name: showConfinedSpace ? watcherName : undefined,
        items: checklistItems,
        workers: selectedWorkers,
        author_employee_id: authorEmployeeId || null,
        safety_manager_employee_id: safetyManagerEmployeeId || null,
        representative_employee_id: representativeEmployeeId || null,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "서버 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/work-permits/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── STEP 1: 등급 선택 ─────────────────────────────────── */}
      <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          STEP 1 · 작업허가 등급
        </h2>
        <div className="flex gap-3">
          {(["A", "B"] as PermitGrade[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGradeSelect(g)}
              className={`flex-1 py-5 rounded-2xl text-xl font-bold border-2 transition-all ${
                grade === g
                  ? g === "A"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-md"
                    : "border-orange-400 bg-orange-50 text-orange-700 shadow-md"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
              }`}
            >
              {g}급
              <p className="text-xs font-normal mt-1 opacity-70">
                {g === "A" ? "고위험 작업" : "일반 위험 작업"}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── STEP 2: 유형 선택 ─────────────────────────────────── */}
      {grade && (
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            STEP 2 · 작업허가 유형
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getPermitTypes(grade).map((type) => {
              const hasTemplate = templates.some(
                (t) => t.grade === grade && t.permit_type === type
              );
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    permitType === type
                      ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span>{type}</span>
                  {!hasTemplate && (
                    <span className="ml-2 text-[10px] text-gray-400">(기본 체크리스트 없음)</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── STEP 3: 기본 정보 + 체크리스트 + 작업인원 ─────────── */}
      {formReady && (
        <>
          {/* 기본 정보 */}
          <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              STEP 3 · 작업 기본 정보
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="작업명 *" required>
                <input
                  type="text"
                  required
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  placeholder="선미 격실 내 용접 작업"
                  className={inputCls}
                />
              </Field>
              <Field label="작업협력사">
                <input
                  type="text"
                  value={workCompany}
                  onChange={(e) => setWorkCompany(e.target.value)}
                  placeholder="(주)○○기계"
                  className={inputCls}
                />
              </Field>
              <Field label="주관작업부서">
                <input
                  type="text"
                  value={workDepartment}
                  onChange={(e) => setWorkDepartment(e.target.value)}
                  placeholder="선장공팀"
                  className={inputCls}
                />
              </Field>
              <Field label="작업장소">
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="3번 블록 E/R"
                  className={inputCls}
                />
              </Field>
              <Field label="작업 시작일">
                <input
                  type="date"
                  value={workPeriodStart}
                  onChange={(e) => setWorkPeriodStart(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="작업 종료일">
                <input
                  type="date"
                  value={workPeriodEnd}
                  onChange={(e) => setWorkPeriodEnd(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="작업인원">
                <input
                  type="number"
                  min={1}
                  value={workerCount}
                  onChange={(e) => setWorkerCount(e.target.value)}
                  placeholder="3"
                  className={inputCls}
                />
              </Field>
              <Field label="관리감독자">
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="홍길동"
                  className={inputCls}
                />
              </Field>
              <Field label="비상연락망" className="sm:col-span-2">
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="010-0000-0000 (안전팀)"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* 밀폐구역 전용 필드 */}
            {showConfinedSpace && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-3">
                  🔵 밀폐구역 전용 추가 정보
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="환기방법">
                    <input
                      type="text"
                      value={ventilationMethod}
                      onChange={(e) => setVentilationMethod(e.target.value)}
                      placeholder="강제환기 (송풍기 2대)"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="감시자 이름">
                    <input
                      type="text"
                      value={watcherName}
                      onChange={(e) => setWatcherName(e.target.value)}
                      placeholder="김감시"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            )}
          </section>

          {/* 체크리스트 */}
          {checklistItems.length > 0 && (
            <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                STEP 4 · 체크리스트
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                각 항목의 적용 여부를 선택하세요. 기본값은 전부 &quot;신청&quot;입니다.
              </p>
              <div className="space-y-5">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg mb-2">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const globalIdx = checklistItems.findIndex(
                          (ci) =>
                            ci.category === item.category && ci.item_text === item.item_text
                        );
                        return (
                          <div
                            key={item.item_text}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1 text-sm text-gray-800">{item.item_text}</div>
                            <button
                              type="button"
                              onClick={() => toggleItemStatus(globalIdx)}
                              className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                                item.apply_status === "신청"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-gray-100 text-gray-500 border-gray-300"
                              }`}
                            >
                              {item.apply_status}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * &quot;해당없음&quot;으로 표시된 항목은 이 작업에 적용되지 않는 항목입니다.
              </p>
            </section>
          )}

          {/* 전자승인 담당자 지정 */}
          <section className="rounded-xl bg-white border border-indigo-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              STEP 5 · 전자승인 담당자 지정
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              각 역할 담당자를 지정하면 고유 서명 링크가 생성됩니다. 미지정 시 링크 발급 없이 진행됩니다.
            </p>
            <div className="space-y-4">
              {(
                [
                  { label: "작성자", value: authorEmployeeId, setter: setAuthorEmployeeId },
                  { label: "안전전담자", value: safetyManagerEmployeeId, setter: setSafetyManagerEmployeeId },
                  { label: "소장/대표", value: representativeEmployeeId, setter: setRepresentativeEmployeeId },
                ] as const
              ).map(({ label, value, setter }) => {
                const selectedEmp = employees.find((e) => e.id === value);
                return (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {label}
                    </label>
                    {employees.length === 0 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        등록된 직원이 없습니다. 직원 관리에서 먼저 등록해 주세요.
                      </p>
                    ) : (
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">— 미지정 —</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                            {emp.department ? ` (${emp.department})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedEmp && !selectedEmp.phone && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        이 직원의 전화번호가 등록되지 않았습니다. 직원 정보에서 전화번호를 추가해야 링크 인증이 가능합니다.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 작업 인원 선택 */}
          <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              STEP 6 · 작업 인원
            </h2>

            {/* 등록된 직원 선택 */}
            {employees.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">등록된 직원에서 선택</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {employees.map((emp) => {
                    const selected = selectedWorkers.some((w) => w.employee_id === emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleEmployee(emp)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-800 font-medium"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-xs text-gray-400 ml-1.5">{emp.department}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 직접 입력 (외부/임시 작업자) */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">
                직접 입력 (미등록 / 외부 작업자)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="이름 *"
                  className={inputCls}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={manualPhone}
                  onChange={(e) =>
                    setManualPhone(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="전화번호 뒷 4자리 *"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="소속/협력사명"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={addManualWorker}
                disabled={!manualName.trim() || manualPhone.length !== 4}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-colors"
              >
                추가
              </button>
              <p className="text-xs text-gray-400 mt-1.5">
                * 이름과 전화번호 뒷 4자리는 서명 본인 확인에 사용됩니다.
              </p>
            </div>

            {/* 선택된 인원 목록 */}
            {selectedWorkers.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  선택된 작업 인원 ({selectedWorkers.length}명)
                </p>
                <div className="space-y-1.5">
                  {selectedWorkers.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-medium text-blue-800">
                        {w.worker_name}
                        {w.is_manual && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            (직접입력{w.company_name ? ` · ${w.company_name}` : ""})
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWorker(idx)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 제출 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl shadow transition-colors"
            >
              {loading ? "저장 중…" : "작업허가서 발행 →"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

// ── 보조 컴포넌트 ──────────────────────────────────────────────

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
