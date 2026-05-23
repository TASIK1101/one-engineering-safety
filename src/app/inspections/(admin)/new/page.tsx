export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import InspectionForm from "@/components/inspection/InspectionForm";
import type { Worksite } from "@/types";

export default async function NewInspectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: worksites } = await supabase
    .from("worksites")
    .select("*")
    .eq("admin_id", user!.id)
    .eq("active", true)
    .order("site_name");

  return (
    <div>
      <div className="mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">새 안전점검 작성</h1>
        <p className="text-sm text-gray-500 mt-1">
          현장 점검항목을 확인하고 불량 사항을 즉시 시정조치로 등록합니다.
        </p>
      </div>
      <InspectionForm worksites={(worksites ?? []) as Worksite[]} />
    </div>
  );
}
