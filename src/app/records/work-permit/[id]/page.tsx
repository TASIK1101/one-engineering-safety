export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import WorkPermitPrintDocument from "@/components/print/documents/WorkPermitPrintDocument";
import type {
  WorkPermit,
  WorkPermitItem,
  WorkPermitWorker,
  WorkPermitApproval,
  WorkPermitGasMeasurement,
  ConfinedSpaceEntryLog,
  RelatedCompanyAgreement,
} from "@/types";
import { isConfinedSpace, isRailWork } from "@/lib/work-permit-types";

export default async function WorkPermitPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: permit } = await supabase
    .from("work_permits")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!permit) notFound();

  const p = permit as WorkPermit;
  const confined = isConfinedSpace(p.permit_type);
  const railWork = isRailWork(p.permit_type);

  const [
    { data: items },
    { data: workers },
    { data: approvals },
    { data: gasMeasurements },
    { data: entryLogs },
    { data: agreements },
  ] = await Promise.all([
    supabase.from("work_permit_items").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_workers").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_approvals").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_gas_measurements").select("*").eq("permit_id", id).order("measured_at"),
    confined
      ? supabase.from("confined_space_entry_logs").select("*").eq("permit_id", id).order("entry_time", { ascending: true })
      : Promise.resolve({ data: [] }),
    railWork
      ? supabase.from("related_company_agreements").select("*").eq("permit_id", id).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const workerList = (workers ?? []) as WorkPermitWorker[];

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref={`/work-permits/${id}`}
        backLabel="← 돌아가기"
        pageTitle="작업허가서 출력"
        hasAppendix={workerList.length > 0}
      />
      <WorkPermitPrintDocument
        permit={p}
        items={(items ?? []) as WorkPermitItem[]}
        workers={workerList}
        approvals={(approvals ?? []) as WorkPermitApproval[]}
        gasMeasurements={(gasMeasurements ?? []) as WorkPermitGasMeasurement[]}
        entryLogs={(entryLogs ?? []) as ConfinedSpaceEntryLog[]}
        agreements={(agreements ?? []) as RelatedCompanyAgreement[]}
      />
    </>
  );
}
