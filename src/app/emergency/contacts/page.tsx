export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmergencyContactsClient from "@/components/emergency/EmergencyContactsClient";
import type { EmergencyContact } from "@/types";

export default async function EmergencyContactsPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: contacts } = await admin
    .from("emergency_contacts")
    .select("*")
    .eq("admin_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비상연락망</h1>
          <p className="text-sm text-gray-500 mt-1">비상 시 연락할 기관 및 담당자를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emergency" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
          <a href="/records/emergency/contacts" target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">🖨️ 인쇄</a>
        </div>
      </div>
      <EmergencyContactsClient initialContacts={(contacts ?? []) as EmergencyContact[]} />
    </div>
  );
}
