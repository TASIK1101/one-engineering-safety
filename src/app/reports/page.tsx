export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import ReportDownloader from "@/components/admin/ReportDownloader";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        교육 이수 기록 출력
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        교육을 선택하면 직원별 이수 현황과 전자서명이 포함된 기록 문서를
        출력하거나 PDF로 저장할 수 있습니다.
      </p>

      {!trainings || trainings.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">등록된 안전교육이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map((training) => (
            <ReportDownloader key={training.id} training={training} />
          ))}
        </div>
      )}
    </div>
  );
}
