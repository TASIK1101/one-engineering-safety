export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StopWorkForm from "@/components/emergency/StopWorkForm";

export default async function NewStopWorkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">작업중지 등록</h1>
        <Link href="/emergency/stop-work" className="text-sm text-gray-500 hover:text-gray-700">← 목록</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <StopWorkForm />
      </div>
    </div>
  );
}
