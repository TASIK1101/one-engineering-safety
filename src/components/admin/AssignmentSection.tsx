"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { v4 as uuidv4 } from "uuid";
import type { Employee, TrainingAssignment } from "@/types";

type AssignmentWithEmployee = TrainingAssignment & { employees: Employee };

export default function AssignmentSection({
  trainingId,
  employees,
  assignments,
}: {
  trainingId: string;
  employees: Employee[];
  assignments: AssignmentWithEmployee[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const assignedIds = new Set(assignments.map((a) => a.employee_id));
  const unassignedEmployees = employees.filter((e) => !assignedIds.has(e.id));

  async function handleAssign(employee: Employee) {
    setAssigning(employee.id);
    const token = uuidv4();
    await supabase.from("training_assignments").insert({
      training_id: trainingId,
      employee_id: employee.id,
      token,
      status: "pending",
    });
    setAssigning(null);
    router.refresh();
  }

  function getTrainingUrl(token: string) {
    return `${window.location.origin}/training/${token}`;
  }

  async function handleCopyLink(token: string) {
    await navigator.clipboard.writeText(getTrainingUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2500);
  }

  function handlePreview(token: string) {
    window.open(getTrainingUrl(token), "_blank");
  }

  return (
    <div className="flex flex-col gap-6">

      {/* 미배정 직원 */}
      {unassignedEmployees.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">교육 링크 생성</h2>
          <p className="text-xs text-gray-400 mb-4">
            직원을 선택하면 개인용 교육 링크가 생성됩니다. 링크를 카카오톡, 문자 등으로 전달하세요.
          </p>
          <div className="flex flex-col gap-2">
            {unassignedEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <span className="font-medium text-sm text-gray-900">{emp.name}</span>
                  {emp.department && (
                    <span className="text-xs text-gray-400 ml-2">{emp.department}</span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleAssign(emp)}
                  loading={assigning === emp.id}
                  className="text-xs"
                >
                  링크 생성
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 완료 현황 */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">교육 완료 현황</h2>
            <div className="flex gap-4 mt-1 text-sm">
              <span className="text-green-600 font-medium">
                완료 {assignments.filter((a) => a.status === "completed").length}명
              </span>
              <span className="text-amber-500 font-medium">
                미완료 {assignments.filter((a) => a.status === "pending").length}명
              </span>
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            아직 링크가 생성된 직원이 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* 직원 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{a.employees.name}</span>
                      {a.employees.department && (
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                          {a.employees.department}
                        </span>
                      )}
                      {a.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          ✓ 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                          ○ 미완료
                        </span>
                      )}
                    </div>
                    {a.completed_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        완료:{" "}
                        {new Date(a.completed_at).toLocaleString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {a.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => handlePreview(a.token)}
                        className="text-xs text-gray-500 border border-gray-200"
                      >
                        미리보기
                      </Button>
                      <Button
                        variant={copied === a.token ? "ghost" : "secondary"}
                        onClick={() => handleCopyLink(a.token)}
                        className={`text-xs min-w-[80px] ${
                          copied === a.token
                            ? "text-green-600 border border-green-200 bg-green-50"
                            : ""
                        }`}
                      >
                        {copied === a.token ? "✓ 복사됨" : "링크 복사"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 링크 URL 표시 (pending 상태) */}
                {a.status === "pending" && (
                  <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-xs text-gray-400 shrink-0">링크</span>
                    <span className="text-xs text-blue-600 font-mono truncate flex-1">
                      {typeof window !== "undefined"
                        ? getTrainingUrl(a.token)
                        : `/training/${a.token}`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
