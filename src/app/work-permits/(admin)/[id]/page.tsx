export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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
import WorkPermitApproveBox from "@/components/work-permit/WorkPermitApproveBox";
import GasMeasurementBox from "@/components/work-permit/GasMeasurementBox";
import ConfinedSpaceEntryLogBox from "@/components/work-permit/ConfinedSpaceEntryLogBox";
import RelatedCompanyAgreementBox from "@/components/work-permit/RelatedCompanyAgreementBox";
import WorkPermitHeader from "@/components/work-permit/WorkPermitHeader";
import WorkPermitStatusAlert from "@/components/work-permit/WorkPermitStatusAlert";
import WorkPermitBasicInfo from "@/components/work-permit/WorkPermitBasicInfo";
import WorkPermitChecklist from "@/components/work-permit/WorkPermitChecklist";
import WorkPermitWorkerSignBox from "@/components/work-permit/WorkPermitWorkerSignBox";
import WorkPermitApprovalLinkBox from "@/components/work-permit/WorkPermitApprovalLinkBox";
import WorkPermitReopenButton from "@/components/work-permit/WorkPermitReopenButton";

export default async function WorkPermitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: permit, error: permitError } = await supabase
    .from("work_permits")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (permitError && permitError.code !== "PGRST116") {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
          <p className="text-sm text-red-500">{permitError.message}</p>
        </div>
      </div>
    );
  }

  if (!permit) notFound();

  const isConfinedSpacePermit = isConfinedSpace(permit.permit_type);
  const isRailWorkPermit = isRailWork(permit.permit_type);

  const [
    { data: items, error: itemsError },
    { data: workers },
    { data: approvals },
    { data: gasMeasurements },
    { data: entryLogs },
    { data: agreements },
  ] = await Promise.all([
    supabase
      .from("work_permit_items")
      .select("*")
      .eq("permit_id", id)
      .order("created_at"),
    supabase
      .from("work_permit_workers")
      .select("*")
      .eq("permit_id", id)
      .order("created_at"),
    supabase
      .from("work_permit_approvals")
      .select("*")
      .eq("permit_id", id)
      .order("created_at"),
    supabase
      .from("work_permit_gas_measurements")
      .select("*")
      .eq("permit_id", id)
      .order("measured_at", { ascending: false }),
    isConfinedSpacePermit
      ? supabase
          .from("confined_space_entry_logs")
          .select("*")
          .eq("permit_id", id)
          .order("entry_time", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    isRailWorkPermit
      ? supabase
          .from("related_company_agreements")
          .select("*")
          .eq("permit_id", id)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsError) {
    console.error("work_permit_items fetch error:", itemsError);
  }

  const p = permit as WorkPermit;
  const checklistItems = (items ?? []) as WorkPermitItem[];
  const workerList = (workers ?? []) as WorkPermitWorker[];
  const approvalList = (approvals ?? []) as WorkPermitApproval[];
  const gasList = (gasMeasurements ?? []) as WorkPermitGasMeasurement[];
  const logList = (entryLogs ?? []) as ConfinedSpaceEntryLog[];
  const agreementList = (agreements ?? []) as RelatedCompanyAgreement[];

  const isLocked = !!p.locked_at || p.status === "승인완료" || p.status === "작업중지";
  const isRejected = p.status === "반려";

  return (
    <div className="max-w-3xl mx-auto">
      <WorkPermitHeader permit={p} permitId={id} />
      <WorkPermitStatusAlert permit={p} checklistItems={checklistItems} />
      <WorkPermitBasicInfo permit={p} isConfinedSpacePermit={isConfinedSpacePermit} />
      <WorkPermitChecklist checklistItems={checklistItems} />

      {isConfinedSpacePermit && (
        <GasMeasurementBox permitId={id} measurements={gasList} isLocked={isLocked} />
      )}
      {isConfinedSpacePermit && (
        <ConfinedSpaceEntryLogBox permitId={id} logs={logList} isLocked={isLocked} />
      )}
      {isRailWorkPermit && (
        <RelatedCompanyAgreementBox
          permitId={id}
          agreements={agreementList}
          isLocked={isLocked}
        />
      )}

      <WorkPermitWorkerSignBox
        workers={workerList}
        isLocked={isLocked}
        isRejected={isRejected}
        permitToken={p.permit_token}
      />

      {/* 관리자 전자승인 현황 */}
      <WorkPermitApprovalLinkBox approvals={approvalList} />

      {/* 승인 무효화 버튼 (잠긴 상태에서만) */}
      {p.locked_at && (
        <div className="mb-4 flex justify-end">
          <WorkPermitReopenButton permitId={id} />
        </div>
      )}

      <WorkPermitApproveBox permitId={id} status={p.status} />
    </div>
  );
}
