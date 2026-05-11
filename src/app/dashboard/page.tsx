export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { count: employeeCount },
    { count: trainingCount },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", user!.id),
    supabase
      .from("trainings")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", user!.id),
    supabase
      .from("training_assignments")
      .select("status, trainings!inner(admin_id)")
      .eq("trainings.admin_id", user!.id),
  ]);

  const completedCount =
    assignments?.filter((a) => a.status === "completed").length ?? 0;
  const pendingCount =
    assignments?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          현장 교육기록 관리 대시보드
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          교육 대상자, 안전교육, 이수 현황, 출력 기록을 한곳에서 관리합니다.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard
          label="교육 대상자"
          sub="등록된 직원 수"
          value={employeeCount ?? 0}
          unit="명"
          href="/employees"
        />
        <StatCard
          label="등록된 안전교육"
          sub="생성된 교육 기록 수"
          value={trainingCount ?? 0}
          unit="개"
          href="/trainings"
          color="indigo"
        />
        <StatCard
          label="이수 완료"
          sub="교육을 완료한 기록"
          value={completedCount}
          unit="건"
          href="/records"
          color="green"
        />
        <StatCard
          label="미이수"
          sub="아직 완료하지 않은 건"
          value={pendingCount}
          unit="건"
          href="/trainings"
          color="amber"
        />
      </div>

      {/* 빠른 작업 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          빠른 작업
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink
            href="/employees"
            icon="👤"
            title="교육 대상자 관리"
            desc="직원 정보를 등록하고 교육 이수 현황을 확인합니다."
            action="대상자 목록 보기"
          />
          <QuickLink
            href="/trainings/new?type=pre_work_training"
            icon="🌅"
            title="오늘 작업 전 안전교육 만들기"
            desc="오늘 날짜 기준 새 작업 전 안전교육을 등록하고 링크를 생성합니다."
            action="교육 만들기"
            highlight
          />
          <QuickLink
            href="/trainings/new"
            icon="📋"
            title="안전교육 등록"
            desc="정기교육, 신규자 교육, 특별교육 등 현장 교육을 등록합니다."
            action="교육 등록하기"
          />
          <QuickLink
            href="/trainings"
            icon="✅"
            title="이수 현황 확인"
            desc="교육별 이수 완료/미이수 대상자를 확인합니다."
            action="현황 확인"
          />
          <QuickLink
            href="/records"
            icon="🗂️"
            title="교육기록 보관함"
            desc="날짜, 유형, 담당자, 작업명 기준으로 교육 기록을 검색합니다."
            action="기록 검색"
          />
          <QuickLink
            href="/reports"
            icon="📄"
            title="이수 기록 출력"
            desc="전자서명이 포함된 교육 이수 기록을 출력하거나 PDF로 저장합니다."
            action="출력 페이지"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  sub,
  value,
  unit,
  href,
  color = "blue",
}: {
  label: string;
  sub: string;
  value: number;
  unit: string;
  href: string;
  color?: "blue" | "indigo" | "green" | "amber";
}) {
  const colorClass = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    green: "text-green-600",
    amber: "text-amber-600",
  }[color];

  const borderClass = {
    blue: "border-l-blue-500",
    indigo: "border-l-indigo-500",
    green: "border-l-green-500",
    amber: "border-l-amber-500",
  }[color];

  return (
    <a
      href={href}
      className={`block rounded-xl bg-white border border-gray-200 border-l-4 ${borderClass} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-3xl font-bold ${colorClass} leading-none`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
      <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
    </a>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon,
  action,
  highlight = false,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  action: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-start gap-4 rounded-xl border p-5 shadow-sm hover:shadow-md transition-all group ${
        highlight
          ? "bg-green-50 border-green-200 hover:border-green-400"
          : "bg-white border-gray-200 hover:border-blue-300"
      }`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${highlight ? "text-green-800" : "text-gray-900"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        <p className={`text-xs font-medium mt-2 ${highlight ? "text-green-700" : "text-blue-600"} group-hover:underline`}>
          {action} →
        </p>
      </div>
    </Link>
  );
}
