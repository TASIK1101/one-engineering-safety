export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmergencyDrillForm from "@/components/emergency/EmergencyDrillForm";

export default async function NewDrillPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: employees }, { data: scenarios }] = await Promise.all([
    admin.from("employees").select("id, name, department").eq("admin_id", user.id).order("name", { ascending: true }),
    admin.from("emergency_scenarios").select("id, scenario_type, title").eq("admin_id", user.id).eq("active", true).order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">비상대응훈련 등록</h1>
        <Link href="/emergency/drills" className="text-sm text-gray-500 hover:text-gray-700">← 목록</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <EmergencyDrillForm
          employees={employees ?? []}
          scenarios={scenarios ?? []}
        />
      </div>
    </div>
  );
}
