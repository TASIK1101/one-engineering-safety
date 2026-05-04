export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ShareLinkBox from "@/components/admin/ShareLinkBox";
import CompletionTable from "@/components/admin/CompletionTable";
import DuplicateTrainingButton from "@/components/admin/DuplicateTrainingButton";
import TrainingConfirmBox from "@/components/admin/TrainingConfirmBox";
import EvidenceStatus from "@/components/admin/EvidenceStatus";
import type { Training, TrainingAssignment } from "@/types";
import { getTypeLabel, getTypeColor } from "@/lib/training-types";

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

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user!.id)
    .order("name");

  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*")
    .eq("training_id", id);

  const t = training as Training;
  const isPreWork = t.training_type === "pre_work_training";
  const allAssignments = (assignments ?? []) as TrainingAssignment[];
  const completedCount = allAssignments.filter(
    (a) => a.status === "completed"
  ).length;
  const totalCount = employees?.length ?? 0;
  const pendingCount = totalCount - completedCount;
  const hasSignatures = allAssignments.some(
    (a) => a.status === "completed" && a.signature_data
  );

  return (
    <div className="max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/trainings"
            className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
          >
            ← 교육 목록
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`shrink-0 inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${getTypeColor(
                t.training_type ?? "regular_training"
              )}`}
            >
              {getTypeLabel(t.training_type ?? "regular_training")}
            </span>
            {isPreWork && t.work_date && (
              <span className="shrink-0 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                {t.work_date}
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {t.title}
            </h1>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {isPreWork && <DuplicateTrainingButton trainingId={id} />}
          <Link
            href={`/print/training/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
          >
            🖨️ 이수 기록 출력
          </Link>
        </div>
      </div>

      {/* 증빙 상태 */}
      <EvidenceStatus
        hasContent={!!t.content}
        hasEmployees={totalCount > 0}
        completedCount={completedCount}
        totalCount={totalCount}
        hasSignatures={hasSignatures}
        hasConfirmation={!!t.confirmed_at}
      />

      {/* 교육 요약 카드 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="font-semibold text-gray-800 mb-4">교육 정보</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
          <SummaryCard label="전체 대상자" value={totalCount} unit="명" />
          <SummaryCard
            label="이수 완료"
            value={completedCount}
            unit="명"
            color="green"
          />
          <SummaryCard
            label="미이수"
            value={pendingCount}
            unit="명"
            color="amber"
          />
          <SummaryCard
            label="확인 문항"
            value={t.quizzes?.length ?? 0}
            unit="문항"
          />
        </div>

        {t.description && (
          <p className="text-sm text-gray-500 mb-3">{t.description}</p>
        )}

        {/* 작업 전 안전교육 전용 정보 블록 */}
        {isPreWork && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {t.work_date && <InfoRow label="작업일" value={t.work_date} />}
            {t.work_name && <InfoRow label="작업명" value={t.work_name} />}
            {t.work_location && (
              <InfoRow label="작업 장소" value={t.work_location} />
            )}
            {t.instructor && (
              <InfoRow label="교육 담당자" value={t.instructor} />
            )}
            {t.risk_factors && (
              <div className="sm:col-span-2">
                <InfoRow label="주요 위험요인" value={t.risk_factors} />
              </div>
            )}
            {t.ppe_check && (
              <div className="sm:col-span-2">
                <InfoRow label="보호구 확인" value={t.ppe_check} />
              </div>
            )}
            {t.daily_notice && (
              <div className="sm:col-span-2">
                <InfoRow label="오늘의 주의사항" value={t.daily_notice} />
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
          {t.content}
        </div>

        {t.quizzes?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {t.quizzes.map((q, i) => (
              <span
                key={i}
                className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1"
              >
                문항 {i + 1}:{" "}
                {q.question.length > 18
                  ? q.question.slice(0, 18) + "…"
                  : q.question}{" "}
                ({q.answer})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 교육 참여 링크 (QR 포함) */}
      <ShareLinkBox trainingId={id} trainingTitle={t.title} />

      {/* 교육 담당자 확인 */}
      <TrainingConfirmBox
        trainingId={id}
        confirmedAt={t.confirmed_at}
        confirmedBy={t.confirmed_by}
        confirmationMemo={t.confirmation_memo}
      />

      {/* 직원별 이수 현황 */}
      <CompletionTable
        employees={employees ?? []}
        assignments={allAssignments}
        training={t}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-green-700">{label}</span>
      <span className="text-gray-800 whitespace-pre-wrap">{value}</span>
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
