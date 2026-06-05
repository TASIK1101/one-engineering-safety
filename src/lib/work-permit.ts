import type { SupabaseClient } from "@supabase/supabase-js";

const APPROVAL_ROLES = ["작성자", "안전전담자", "소장대표"] as const;

function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

/**
 * 작업허가서 상태를 재계산하여 work_permits.status를 업데이트한다.
 * - 작업중지 상태는 건드리지 않는다.
 * - 논리:
 *   반려 row 존재 → 반려
 *   전체 작업자 서명 완료 + 3 역할 전부 승인 → 승인완료 (locked_at 기록)
 *   전체 작업자 서명 완료 → 검토중
 *   그 외 → 서명중
 */
export async function recomputePermitStatus(
  admin: SupabaseClient,
  permitId: string
): Promise<void> {
  const { data: current } = await admin
    .from("work_permits")
    .select("status")
    .eq("id", permitId)
    .single();

  if (current?.status === "작업중지") return;

  const [{ data: workers }, { data: approvals }] = await Promise.all([
    admin
      .from("work_permit_workers")
      .select("id, signed_at")
      .eq("permit_id", permitId),
    admin
      .from("work_permit_approvals")
      .select("approver_role, approval_status, rejection_reason, approved_at")
      .eq("permit_id", permitId),
  ]);

  const total = workers?.length ?? 0;
  const signed = workers?.filter((w) => w.signed_at).length ?? 0;
  const allWorkersSigned = total > 0 && signed === total;

  const hasRejection =
    approvals?.some((a) => a.approval_status === "반려") ?? false;
  const allApproved = APPROVAL_ROLES.every((role) =>
    approvals?.some(
      (a) => a.approver_role === role && a.approval_status === "승인"
    )
  );

  const now = new Date().toISOString();

  let newStatus: string;
  const update: Record<string, unknown> = { updated_at: now };

  if (hasRejection) {
    newStatus = "반려";
    const rejected = approvals
      ?.filter((a) => a.approval_status === "반려")
      .sort((a, b) =>
        (b.approved_at ?? "").localeCompare(a.approved_at ?? "")
      )[0];
    if (rejected?.rejection_reason) {
      update.rejection_reason = rejected.rejection_reason;
    }
    update.locked_at = null;
  } else if (allWorkersSigned && allApproved) {
    newStatus = "승인완료";
    update.locked_at = now;
    update.approved_at = now;
  } else if (allWorkersSigned) {
    newStatus = "검토중";
    update.locked_at = null;
  } else {
    newStatus = "서명중";
    update.locked_at = null;
  }

  update.status = newStatus;
  await admin.from("work_permits").update(update).eq("id", permitId);
}

/**
 * approval_token으로 서명자 본인 검증.
 * 전체 직원 목록 노출 없이 지정된 approver_employee_id만 조회한다.
 */
export async function verifyPermitApprover(
  admin: SupabaseClient,
  approvalToken: string,
  name: string,
  phoneLast4: string
): Promise<
  | {
      ok: true;
      approvalId: string;
      permitId: string;
      approverName: string;
      approverRole: string;
      alreadyDone: boolean;
    }
  | { ok: false; reason: string }
> {
  const { data: approval } = await admin
    .from("work_permit_approvals")
    .select(
      "id, permit_id, approver_role, approver_employee_id, approver_name, approval_status"
    )
    .eq("approval_token", approvalToken)
    .maybeSingle();

  if (!approval) return { ok: false, reason: "invalid_token" };

  if (!approval.approver_employee_id) {
    return { ok: false, reason: "no_employee_assigned" };
  }

  const { data: emp } = await admin
    .from("employees")
    .select("id, name, phone")
    .eq("id", approval.approver_employee_id)
    .single();

  if (!emp) return { ok: false, reason: "invalid_token" };

  const inputName = normalizeName(name);
  const empName = normalizeName(emp.name);
  if (inputName !== empName) return { ok: false, reason: "name_mismatch" };

  const empPhone = (emp.phone ?? "").replace(/\D/g, "").slice(-4);
  if (!empPhone || empPhone !== phoneLast4)
    return { ok: false, reason: "phone_mismatch" };

  const alreadyDone =
    approval.approval_status === "승인" || approval.approval_status === "반려";

  return {
    ok: true,
    approvalId: approval.id,
    permitId: approval.permit_id,
    approverName: emp.name,
    approverRole: approval.approver_role,
    alreadyDone,
  };
}
