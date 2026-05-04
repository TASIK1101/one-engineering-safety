"use client";

import { useState } from "react";
import type { Employee, Training, TrainingAssignment } from "@/types";

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Filter = "all" | "completed" | "pending";

export default function CompletionTable({
  employees,
  assignments,
  training,
}: {
  employees: Employee[];
  assignments: TrainingAssignment[];
  training: Training;
}) {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);

  const assignmentMap = new Map(assignments.map((a) => [a.employee_id, a]));
  const completedCount = assignments.filter(
    (a) => a.status === "completed"
  ).length;
  const pendingCount = employees.length - completedCount;

  const filteredEmployees = employees.filter((emp) => {
    const a = assignmentMap.get(emp.id);
    const isCompleted = a?.status === "completed";
    if (filter === "completed") return isCompleted;
    if (filter === "pending") return !isCompleted;
    return true;
  });

  const pendingEmployees = employees.filter((emp) => {
    const a = assignmentMap.get(emp.id);
    return a?.status !== "completed";
  });

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) ?? null;
  const selectedAssignment = selectedEmpId
    ? assignmentMap.get(selectedEmpId) ?? null
    : null;

  async function handleCopyPending() {
    const text =
      "미이수자:\n" + pendingEmployees.map((e) => `• ${e.name}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const filterBtnBase =
    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border";
  const filterActive = "bg-blue-600 text-white border-blue-600";
  const filterInactive = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

  return (
    <>
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">직원별 이수 현황</h2>
              <div className="flex gap-4 mt-1.5 text-sm">
                <span className="text-gray-500">
                  전체{" "}
                  <strong className="text-gray-900">{employees.length}</strong>명
                </span>
                <span className="text-green-600">
                  이수 완료 <strong>{completedCount}</strong>명
                </span>
                <span className="text-amber-500">
                  미이수 <strong>{pendingCount}</strong>명
                </span>
              </div>
            </div>

            {/* 필터 버튼 */}
            <div className="flex items-center gap-2">
              {filter === "pending" && pendingEmployees.length > 0 && (
                <button
                  onClick={handleCopyPending}
                  className={`${filterBtnBase} ${copied ? "bg-green-600 text-white border-green-600" : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"}`}
                >
                  {copied ? "✓ 복사됨" : "미이수 목록 복사"}
                </button>
              )}
              <button
                onClick={() => setFilter("all")}
                className={`${filterBtnBase} ${filter === "all" ? filterActive : filterInactive}`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`${filterBtnBase} ${filter === "completed" ? "bg-green-600 text-white border-green-600" : filterInactive}`}
              >
                이수 완료
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`${filterBtnBase} ${filter === "pending" ? "bg-amber-500 text-white border-amber-500" : filterInactive}`}
              >
                미이수만
              </button>
            </div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            등록된 교육 대상자가 없습니다.{" "}
            <a href="/employees/new" className="text-blue-600 hover:underline">
              대상자를 먼저 등록해주세요.
            </a>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {filter === "completed"
              ? "이수 완료한 직원이 없습니다."
              : "미이수 직원이 없습니다. 모두 이수 완료했습니다!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">이름</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">부서 / 직급</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">이수 상태</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">교육 시작</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">제출 완료</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">소요 시간</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">확인 문항</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => {
                  const a = assignmentMap.get(emp.id);
                  const isCompleted = a?.status === "completed";
                  const quizCorrect =
                    isCompleted && a?.quiz_answers
                      ? a.quiz_answers.filter(
                          (ans, i) => ans === training.quizzes[i]?.answer
                        ).length
                      : null;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-gray-500">{emp.department || "-"}</td>
                      <td className="px-4 py-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            ✓ 이수 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                            ○ 미이수
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDateTime(a?.started_at ?? null)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDateTime(a?.completed_at ?? null)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDuration(a?.duration_seconds ?? null)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {quizCorrect !== null
                          ? `${quizCorrect}/${training.quizzes.length} 정답`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a && (
                          <button
                            onClick={() => setSelectedEmpId(emp.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            상세보기
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 기록 모달 */}
      {selectedEmpId && selectedEmp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedEmpId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">이수 기록 상세</h3>
              <button
                onClick={() => setSelectedEmpId(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  직원 정보
                </h4>
                <div className="flex flex-col gap-1.5 text-sm">
                  <ModalRow label="이름" value={selectedEmp.name} />
                  <ModalRow label="부서 / 직급" value={selectedEmp.department || "-"} />
                  <ModalRow label="교육명" value={training.title} />
                  <ModalRow label="본인확인 방식" value="이름 + 전화번호 뒷자리 4자리" />
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  이수 기록
                </h4>
                <div className="flex flex-col gap-1.5 text-sm">
                  <ModalRow label="교육 시작" value={formatDateTime(selectedAssignment?.started_at ?? null)} />
                  <ModalRow label="제출 완료" value={formatDateTime(selectedAssignment?.completed_at ?? null)} />
                  <ModalRow label="소요 시간" value={formatDuration(selectedAssignment?.duration_seconds ?? null)} />
                  <ModalRow label="동의 여부" value={selectedAssignment?.consent_checked ? "동의함" : "-"} />
                  <ModalRow
                    label="이수 상태"
                    value={selectedAssignment?.status === "completed" ? "이수 완료" : "미이수"}
                  />
                </div>
              </section>

              {selectedAssignment?.quiz_answers && (
                <section>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    교육 확인 문항 응답
                  </h4>
                  <div className="flex flex-col gap-2">
                    {training.quizzes.map((q, i) => {
                      const userAns = selectedAssignment.quiz_answers![i];
                      const correct = userAns === q.answer;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm rounded-lg border border-gray-100 p-3"
                        >
                          <span className="shrink-0 text-xs font-bold text-gray-400 mt-0.5">
                            문항 {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 text-xs leading-snug">{q.question}</p>
                            <p className="mt-1 text-xs">
                              <span className="text-gray-500">응답: <strong>{userAns}</strong></span>
                              <span className="mx-1 text-gray-300">|</span>
                              <span className="text-gray-500">정답: <strong>{q.answer}</strong></span>
                              <span className={`ml-2 font-semibold ${correct ? "text-green-600" : "text-red-500"}`}>
                                {correct ? "✓ 정답" : "✗ 오답"}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {selectedAssignment?.signature_data && (
                <section>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    전자서명
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedAssignment.signature_data}
                      alt="전자서명"
                      className="max-h-24 max-w-full"
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setSelectedEmpId(null)}
                className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 shrink-0 text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
