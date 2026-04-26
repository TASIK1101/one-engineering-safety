"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function DeleteEmployeeButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (!confirm(`${name} 직원을 삭제하시겠습니까?\n관련 교육 기록도 함께 삭제됩니다.`)) return;
    setLoading(true);
    await supabase.from("employees").delete().eq("id", id);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      onClick={handleDelete}
      loading={loading}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
    >
      삭제
    </Button>
  );
}
