export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getTypeLabel, getTypeColor } from "@/lib/training-types";
import type { Training } from "@/types";
import RecordsFilter from "./RecordsFilter";

type TrainingWithStats = Training & {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
};

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    instructor?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employees } = await supabase
    .from("employees")
    .select("id")
    .eq("admin_id", user!.id);

  const employeeIds = (employees ?? []).map((e) => e.id);

  let query = supabase
    .from("trainings")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false });

  if (params.type) query = query.eq("training_type", params.type);
  if (params.instructor)
    query = query.ilike("instructor", `%${params.instructor}%`);

  const { data: rawTrainings } = await query;
  const trainings = (rawTrainings ?? []) as Training[];

  // 각 교육별 이수 통계 조회 (한 번의 쿼리로 집계)
  const trainingIds = trainings.map((t) => t.id);
  const { data: allAssignments } =
    trainingIds.length > 0
      ? await supabase
          .from("training_assignments")
          .select("training_id, status, employee_id")
          .in("training_id", trainingIds)
      : { data: [] };

  const statsMap = new Map<
    string,
    { completed: number; pending: number; total: number }
  >();
  for (const t of trainings) {
    statsMap.set(t.id, { completed: 0, pending: 0, total: employeeIds.length });
  }
  for (const a of allAssignments ?? []) {
    const s = statsMap.get(a.training_id);
    if (!s) continue;
    if (a.status === "completed") s.completed++;
    else s.pending++;
  }

  // 클라이언트-사이드 필터링이 필요한 항목 (title, work_name 검색)
  let filtered = trainings.map((t) => ({
    ...t,
    totalCount: statsMap.get(t.id)?.total ?? 0,
    completedCount: statsMap.get(t.id)?.completed ?? 0,
    pendingCount:
      (statsMap.get(t.id)?.total ?? 0) -
      (statsMap.get(t.id)?.completed ?? 0),
  })) as TrainingWithStats[];

  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.work_name ?? "").toLowerCase().includes(q)
    );
  }
  if (params.status === "completed") {
    filtered = filtered.filter((t) => t.completedCount >= t.totalCount && t.totalCount > 0);
  } else if (params.status === "pending") {
    filtered = filtered.filter((t) => t.pendingCount > 0);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">교육기록 보관함</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          교육 기록을 검색하고 출력할 수 있습니다.
        </p>
      </div>

      {/* 검색/필터 */}
      <RecordsFilter />

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center mt-4">
          <p className="text-gray-400 text-sm">
            {params.q || params.type || params.status
              ? "검색 조건에 맞는 교육 기록이 없습니다."
              : "등록된 교육 기록이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* 배지 행 */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTypeColor(
                        t.training_type ?? "regular_training"
                      )}`}
                    >
                      {getTypeLabel(t.training_type ?? "regular_training")}
                    </span>
                    {t.work_date && (
                      <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        {t.work_date}
                      </span>
                    )}
                  </div>

                  {/* 교육명 */}
                  <p className="font-semibold text-gray-900">{t.title}</p>

                  {/* 메타 정보 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span>
                      등록일:{" "}
                      {new Date(t.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    {t.work_name && <span>작업명: {t.work_name}</span>}
                    {t.instructor && <span>담당자: {t.instructor}</span>}
                    {t.work_location && <span>장소: {t.work_location}</span>}
                  </div>
                </div>

                {/* 이수 통계 + 버튼 */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">
                      전체{" "}
                      <strong className="text-gray-800">{t.totalCount}</strong>명
                    </span>
                    <span className="text-green-600">
                      완료 <strong>{t.completedCount}</strong>명
                    </span>
                    <span className="text-amber-500">
                      미이수 <strong>{t.pendingCount}</strong>명
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/trainings/${t.id}`}
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      이수 현황
                    </Link>
                    <Link
                      href={`/print/training/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      🖨️ 출력
                    </Link>
                  </div>
                </div>
              </div>

              {/* 이수율 바 */}
              {t.totalCount > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round(
                          (t.completedCount / t.totalCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                    이수율{" "}
                    {Math.round((t.completedCount / t.totalCount) * 100)}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
