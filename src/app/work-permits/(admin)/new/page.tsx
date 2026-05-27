export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import type { Employee, WorkPermitTemplate } from "@/types";
import WorkPermitNewForm from "@/components/work-permit/WorkPermitNewForm";
import Link from "next/link";

export default async function NewWorkPermitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user!.id)
    .order("name");

  const { data: templates } = await supabase
    .from("work_permit_templates")
    .select("*")
    .eq("active", true)
    .order("grade, permit_type");

  return (
    <div>
      <div className="mb-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/work-permits" className="text-sm text-gray-400 hover:text-gray-600">
            ← 작업허가서
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">새 작업허가서 작성</h1>
        <p className="text-sm text-gray-500 mt-1">
          등급과 작업 유형을 선택하면 체크리스트가 자동으로 불러와집니다.
        </p>
      </div>

      <WorkPermitNewForm
        employees={(employees ?? []) as Employee[]}
        templates={(templates ?? []) as WorkPermitTemplate[]}
      />
    </div>
  );
}
