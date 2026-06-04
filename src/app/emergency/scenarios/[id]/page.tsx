export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ScenarioEditor from "@/components/emergency/ScenarioEditor";
import type { EmergencyScenario } from "@/types";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("emergency_scenarios")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user.id)
    .single();

  if (!data) notFound();
  const scenario = data as EmergencyScenario;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/emergency/scenarios" className="text-sm text-gray-500 hover:text-gray-700">← 시나리오 목록</Link>
      </div>
      <ScenarioEditor scenario={scenario} />
    </div>
  );
}
