export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: employeeCount }, { count: trainingCount }, { data: assignments }] =
    await Promise.all([
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

  const completedCount = assignments?.filter((a) => a.status === "completed").length ?? 0;
  const pendingCount = assignments?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="등록 직원" value={employeeCount ?? 0} unit="명" />
        <StatCard label="생성 교육" value={trainingCount ?? 0} unit="개" />
        <StatCard label="교육 완료" value={completedCount} unit="건" color="green" />
        <StatCard label="교육 미완료" value={pendingCount} unit="건" color="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/employees/new"
          title="직원 등록"
          desc="새 직원을 등록하고 교육을 배정하세요"
          icon="👤"
        />
        <QuickLink
          href="/trainings/new"
          title="교육 생성"
          desc="안전교육 내용과 퀴즈를 작성하세요"
          icon="📋"
        />
        <QuickLink
          href="/trainings"
          title="교육 현황"
          desc="직원별 완료/미완료 현황을 확인하세요"
          icon="✅"
        />
        <QuickLink
          href="/reports"
          title="교육일지 출력"
          desc="서명이 포함된 교육일지를 PDF로 다운로드하세요"
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
