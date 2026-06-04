export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmergencyEquipmentClient from "@/components/emergency/EmergencyEquipmentClient";
import { isInspectionDue } from "@/lib/emergency";
import type { EmergencyEquipment } from "@/types";

export default async function EmergencyEquipmentPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("emergency_equipment")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as EmergencyEquipment[];
  const active = list.filter((e) => e.active);
  const ok = active.filter((e) => e.status === "정상").length;
  const needCheck = active.filter((e) => e.status === "점검필요").length;
  const unusable = active.filter((e) => e.status === "사용불가").length;
  const dueSoon = active.filter((e) => isInspectionDue(e.next_inspection_date)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비상장비 현황</h1>
          <p className="text-sm text-gray-500 mt-1">소화기·구급함 등 비상장비를 등록하고 점검 일정을 관리합니다.</p>
        </div>
        <Link href="/emergency" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "정상", value: ok, cls: "border-l-green-500 text-green-700" },
          { label: "점검필요", value: needCheck, cls: "border-l-amber-500 text-amber-700" },
          { label: "사용불가", value: unusable, cls: "border-l-red-500 text-red-700" },
          { label: "30일내 점검", value: dueSoon, cls: "border-l-orange-400 text-orange-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl bg-white border border-gray-200 border-l-4 ${cls.split(" ")[0]} p-4`}>
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className={`text-2xl font-bold ${cls.split(" ")[1]}`}>{value}<span className="text-sm font-normal text-gray-400 ml-1">개</span></p>
          </div>
        ))}
      </div>

      <EmergencyEquipmentClient initialEquipment={list} />
    </div>
  );
}
