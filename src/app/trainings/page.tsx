export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import TrainingTypeTabs from "@/components/admin/TrainingTypeTabs";
import { getTypeLabel, getTypeColor } from "@/lib/training-types";
import { Suspense } from "react";
import type { Training } from "@/types";

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("trainings")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("training_type", type);
  }

  const { data: trainings } = await query;

  const isPreWorkTab = type === "pre_work_training";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">안전교육 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            교육 이수 현황을 한눈에 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          {isPreWorkTab && (
            <Link href="/trainings/new?type=pre_work_training">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
                오늘 작업 전 안전교육 만들기
              </Button>
            </Link>
          )}
          <Link href="/trainings/new">
            <Button>+ 안전교육 등록</Button>
          </Link>
        </div>
      </div>

      {/* 교육 유형 탭 필터 */}
      <Suspense>
        <TrainingTypeTabs />
      </Suspense>

      {!trainings || trainings.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {type
              ? `해당 유형의 안전교육이 없습니다.`
              : "등록된 안전교육이 없습니다."}
          </p>
          {isPreWorkTab ? (
            <Link href="/trainings/new?type=pre_work_training">
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                오늘 작업 전 안전교육 만들기
              </Button>
            </Link>
          ) : (
            !type && (
              <Link href="/trainings/new">
                <Button className="mt-4">첫 안전교육 등록하기</Button>
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(trainings as Training[]).map((training) => {
            const isPreWork = training.training_type === "pre_work_training";
            return (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTypeColor(
                        training.training_type ?? "regular_training"
                      )}`}
                    >
                      {getTypeLabel(training.training_type ?? "regular_training")}
                    </span>
                    {isPreWork && training.work_date && (
                      <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        {training.work_date}
                      </span>
                    )}
                    {isPreWork && training.work_name && (
                      <span className="text-[11px] text-gray-500">
                        {training.work_name}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{training.title}</p>
                  {isPreWork ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[training.work_location, training.instructor]
                        .filter(Boolean)
                        .join(" · ") || training.content.slice(0, 60)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {training.description || training.content.slice(0, 60)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(training.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  <span className="text-blue-600 text-sm">이수 현황 →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
