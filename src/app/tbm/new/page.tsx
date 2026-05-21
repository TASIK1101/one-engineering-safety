import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TBMNewForm from "@/components/tbm/TBMNewForm";
import type { Employee, Worksite } from "@/types";

export default async function TbmNewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: employees }, { data: worksites }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, name, department")
      .eq("admin_id", user!.id)
      .order("name"),
    supabase
      .from("worksites")
      .select("id, site_name, location")
      .eq("admin_id", user!.id)
      .eq("active", true)
      .order("site_name"),
  ]);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">로딩 중...</div>
      }
    >
      <TBMNewForm
        employees={(employees ?? []) as Employee[]}
        worksites={(worksites ?? []) as Worksite[]}
      />
    </Suspense>
  );
}
