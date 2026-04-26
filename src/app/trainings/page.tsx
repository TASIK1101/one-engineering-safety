export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function TrainingsPage() {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">교육 관리</h1>
        <Link href="/trainings/new">
          <Button>+ 교육 생성</Button>
        </Link>
      </div>

      {!trainings || trainings.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">생성된 교육이 없습니다.</p>
          <Link href="/trainings/new">
            <Button className="mt-4">첫 교육 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map((training) => (
            <Link
              key={training.id}
              href={`/trainings/${training.id}`}
              className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">{training.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                  {training.description || training.content.slice(0, 60)}
                </p>
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <span className="text-xs text-gray-400">
                  {new Date(training.created_at).toLocaleDateString("ko-KR")}
                </span>
                <span className="text-blue-600 text-sm">상세보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
