import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TBMNewForm from "@/components/tbm/TBMNewForm";
import type { Employee } from "@/types";

export default async function TbmNewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, department")
    .eq("admin_id", user!.id)
    .order("name");

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">로딩 중...</div>
      }
    >
      <TBMNewForm employees={(employees ?? []) as Employee[]} />
    </Suspense>
  );
}
