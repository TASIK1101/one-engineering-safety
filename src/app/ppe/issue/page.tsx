export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PpeIssueForm from "@/components/ppe/PpeIssueForm";
import type { Employee, PpeItem } from "@/types";

export default async function PpeIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const { employee } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: employees, error: empErr }, { data: items, error: itemErr }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, name, department")
        .eq("admin_id", user!.id)
        .order("name"),
      supabase
        .from("ppe_items")
        .select("id, item_name, category, replacement_cycle_months")
        .eq("admin_id", user!.id)
        .eq("active", true)
        .order("category")
        .order("item_name"),
    ]);

  if (empErr || itemErr) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-red-500">{empErr?.message || itemErr?.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ppe" className="text-gray-400 hover:text-gray-600 text-sm">← 보호구 관리</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">보호구 지급</h1>
      </div>
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <PpeIssueForm
          employees={(employees ?? []) as Pick<Employee, "id" | "name" | "department">[]}
          items={(items ?? []) as Pick<PpeItem, "id" | "item_name" | "category" | "replacement_cycle_months">[]}
          presetEmployeeId={employee}
        />
      </div>
    </div>
  );
}
