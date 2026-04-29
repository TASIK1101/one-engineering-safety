export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ShareLinkBox from "@/components/admin/ShareLinkBox";
import CompletionTable from "@/components/admin/CompletionTable";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: training } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!training) notFound();

  // 이 관리자의 전체 직원
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user!.id)
    .order("name");

  // 이 교육의 완료 기록
  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*")
    .eq("training_id", id);

  return (
    <div className="max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/trainings" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">
            ← 교육 목록
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900 truncate">{training.title}</h1>
        </div>
        <Link
          href={`/print/training/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          🖨️ 교육일지 출력
        </Link>
      </div>

      {/* 교육 내용 요약 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="font-semibold text-gray-800 mb-3">교육 내용</h2>
        {training.description && (
          <p className="text-sm text-gray-500 mb-3">{training.description}</p>
        )}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
          {training.content}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(training.quizzes as { question: string; answer: string }[]).map(
            (q, i) => (
              <span
                key={i}
                className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1"
              >
                Q{i + 1}: {q.question.length > 18 ? q.question.slice(0, 18) + "…" : q.question}{" "}
                ({q.answer})
              </span>
            )
          )}
        </div>
      </div>

      {/* 공유 링크 */}
      <ShareLinkBox trainingId={id} trainingTitle={training.title} />

      {/* 전 직원 완료 현황 */}
      <CompletionTable
        employees={employees ?? []}
        assignments={assignments ?? []}
      />
    </div>
  );
}
