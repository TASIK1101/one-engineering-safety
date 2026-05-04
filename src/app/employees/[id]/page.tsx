export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Employee, Training, TrainingAssignment } from "@/types";
import { getTypeLabel, getTypeColor } from "@/lib/training-types";
import SignatureViewer from "./SignatureViewer";

type AssignmentWithTraining = TrainingAssignment & { trainings: Training };

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

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (!employee) notFound();

  const emp = employee as Employee;

  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*, trainings(*)")
    .eq("employee_id", id)
    .order("created_at", { ascending: false });

  const all = (assignments ?? []) as AssignmentWithTraining[];
  const completedList = all.filter((a) => a.status === "completed");
  const pendingList = all.filter((a) => a.status === "pending");

  return (
    <div className="max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/employees"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 교육 대상자 목록
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{emp.name} 교육 이력</h1>
      </div>

      {/* 직원 프로필 카드 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="font-semibold text-gray-800 mb-4">직원 정보</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <SummaryCard label="배정 교육" value={all.length} unit="건" />
          <SummaryCard
            label="이수 완료"
            value={completedList.length}
            unit="건"
            color="green"
          />
          <SummaryCard
            label="미이수"
            value={pendingList.length}
            unit="건"
            color="amber"
          />
          <SummaryCard
            label="이수율"
            value={
              all.length > 0
                ? Math.round((completedList.length / all.length) * 100)
                : 0
            }
            unit="%"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <InfoRow label="이름" value={emp.name} />
          <InfoRow label="부서 / 직급" value={emp.department || "-"} />
          <InfoRow
            label="전화번호"
            value={emp.phone ? `···${emp.phone.slice(-4)}` : "-"}
          />
        </div>
      </div>

      {/* 교육 이력 목록 */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">교육 이력</h2>
        </div>

        {all.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            배정된 교육이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {all.map((a) => {
              const t = a.trainings;
              const isCompleted = a.status === "completed";
              return (
                <div key={a.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTypeColor(
                            t?.training_type ?? "regular_training"
                          )}`}
                        >
                          {getTypeLabel(t?.training_type ?? "regular_training")}
                        </span>
                        {isCompleted ? (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            ✓ 이수 완료
                          </span>
                        ) : (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            ○ 미이수
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {t?.title ?? "(삭제된 교육)"}
                      </p>
                      {isCompleted && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                          <span>완료: {formatDateTime(a.completed_at)}</span>
                          <span>소요: {formatDuration(a.duration_seconds)}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex gap-2 items-center">
                      {a.signature_data && (
                        <SignatureViewer
                          signatureData={a.signature_data}
                          name={emp.name}
                        />
                      )}
                      {t?.id && (
                        <Link
                          href={`/print/training/${t.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          🖨️ 출력
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color = "blue",
}: {
  label: string;
  value: number;
  unit: string;
  color?: "blue" | "green" | "amber";
}) {
  const colorClass = {
    blue: "text-blue-600",
    green: "text-green-600",
    amber: "text-amber-500",
  }[color];

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>
        {value}
        <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
