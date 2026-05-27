export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import WorkPermitWorkerGuard from "@/components/work-permit/WorkPermitWorkerGuard";
import WorkPermitWorkerSignForm from "@/components/work-permit/WorkPermitWorkerSignForm";
import type { WorkPermit, WorkPermitItem, WorkPermitWorker } from "@/types";

export default async function WorkPermitWorkerSignPage({
  params,
}: {
  params: Promise<{ permitToken: string; workerId: string }>;
}) {
  const { permitToken, workerId } = await params;
  const supabase = await createClient();

  const { data: permit } = await supabase
    .from("work_permits")
    .select("*")
    .eq("permit_token", permitToken)
    .single();

  if (!permit) notFound();

  const { data: worker } = await supabase
    .from("work_permit_workers")
    .select("*")
    .eq("id", workerId)
    .eq("permit_id", permit.id)
    .single();

  if (!worker) notFound();

  const { data: items } = await supabase
    .from("work_permit_items")
    .select("*")
    .eq("permit_id", permit.id)
    .order("created_at");

  const p = permit as WorkPermit;
  const w = worker as WorkPermitWorker;
  const checklistItems = (items ?? []) as WorkPermitItem[];

  return (
    <WorkPermitWorkerGuard permitToken={permitToken} workerId={workerId}>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <div>
                <p className="text-[11px] text-gray-400 font-medium">
                  주식회사 원엔지니어링 · 작업허가서 서명
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {p.grade}급 — {p.permit_type}
                </p>
              </div>
            </div>
            <Link
              href={`/work-permits/sign/${permitToken}`}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
            >
              ← 뒤로
            </Link>
          </div>
        </header>

        <div className="max-w-xl mx-auto px-4 py-6 pb-16">
          <WorkPermitWorkerSignForm
            permit={{
              grade: p.grade,
              permit_type: p.permit_type,
              work_name: p.work_name,
              work_location: p.work_location,
              supervisor_name: p.supervisor_name,
            }}
            worker={w}
            items={checklistItems}
          />
        </div>
      </div>
    </WorkPermitWorkerGuard>
  );
}
