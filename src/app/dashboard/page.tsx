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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">대시보드</h1>
      <p className="text-sm text-gray-500 mb-6">
        직원별 교육 참여 및 서명 기록을 관리합니다.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="교육 대상자" value={employeeCount ?? 0} unit="명" />
        <StatCard label="등록된 안전교육" value={trainingCount ?? 0} unit="개" />
        <StatCard
          label="이수 완료"
          value={completedCount}
          unit="건"
          color="green"
        />
        <StatCard
          label="미이수"
          value={pendingCount}
          unit="건"
          color="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/employees/new"
          title="교육 대상자 등록"
          desc="교육 대상자를 등록하고 안전교육 이수 현황을 관리하세요"
          icon="👤"
        />
        <QuickLink
          href="/trainings/new"
          title="안전교육 등록"
          desc="안전교육 내용과 교육 확인 문항을 작성하세요"
          icon="📋"
        />
        <QuickLink
          href="/trainings"
          title="이수 현황 확인"
          desc="대상자별 이수 완료/미이수 현황을 확인하세요"
          icon="✅"
        />
        <QuickLink
          href="/reports"
          title="교육 이수 기록 출력"
          desc="전자서명이 포함된 교육 이수 기록을 출력하거나 PDF로 저장하세요"
          icon="📄"
        />
      </div>
    </div>
  );
}

function StatCard({
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
    amber: "text-amber-600",
  }[color];

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
