"use client";

import type { Employee, TrainingAssignment } from "@/types";

export default function CompletionTable({
  employees,
  assignments,
}: {
  employees: Employee[];
  assignments: TrainingAssignment[];
}) {
  // employee_id → assignment 맵
  const assignmentMap = new Map(
    assignments.map((a) => [a.employee_id, a])
  );

  const completedCount = assignments.filter(
    (a) => a.status === "completed"
  ).length;
  const pendingCount = employees.length - completedCount;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">직원별 완료 현황</h2>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-gray-500">
            전체 <strong className="text-gray-900">{employees.length}</strong>명
          </span>
          <span className="text-green-600">
            완료 <strong>{completedCount}</strong>명
          </span>
          <span className="text-amber-500">
            미완료 <strong>{pendingCount}</strong>명
          </span>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          등록된 직원이 없습니다.{" "}
          <a href="/employees/new" className="text-blue-600 hover:underline">
            직원을 먼저 등록해주세요.
          </a>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">이름</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">부서 / 직급</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">상태</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">완료일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const assignment = assignmentMap.get(emp.id);
              const isCompleted = assignment?.status === "completed";

              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {emp.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {emp.department || "-"}
                  </td>
                  <td className="px-5 py-3">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        ✓ 완료
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                        ○ 미완료
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {assignment?.completed_at
                      ? new Date(assignment.completed_at).toLocaleString(
                          "ko-KR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
