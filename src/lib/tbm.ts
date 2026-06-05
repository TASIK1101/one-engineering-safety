import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export const TBM_APPROVAL_ROLES = ["안전전담자", "소장대표"] as const;

/** 공백 제거 후 비교용 정규화 */
export function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

/**
 * 참석자 서명 + 역할별 전자확인 상태를 종합하여 tbm_records.status를 재계산·반영한다.
 *
 * 완료 조건:
 *  - 대표 승인 불필요: 참석자 전원 서명 + 안전전담자 승인 → '완료'
 *  - 대표 승인 필요:   참석자 전원 서명 + 안전전담자 승인 + 소장대표 승인 → '완료'
 *
 * 전자확인이 구성되지 않은(레거시) TBM은 기존 동작(검토중 → 관리자 승인)을 유지한다.
 * 이미 완료(locked_at 설정)된 레코드는 변경하지 않는다.
 */
export async function recomputeTbmStatus(admin: Admin, tbmRecordId: string): Promise<void> {
  const { data: rec } = await admin
    .from("tbm_records")
    .select("id, status, require_representative_approval, locked_at")
    .eq("id", tbmRecordId)
    .single();
  if (!rec) return;
  if (rec.locked_at) return; // 이미 완료(잠금) → 변경 금지

  const [{ data: attendees }, { data: approvals }] = await Promise.all([
    admin.from("tbm_attendees").select("attendance_status").eq("tbm_record_id", tbmRecordId),
    admin
      .from("tbm_approvals")
      .select("approver_role, approver_name, approval_status")
      .eq("tbm_record_id", tbmRecordId),
  ]);

  const atts = attendees ?? [];
  const apprs = approvals ?? [];

  const attendeesDone =
    atts.length > 0 &&
    atts.every((a) => a.attendance_status === "서명완료" || a.attendance_status === "불참");

  const anyRejected = apprs.some((a) => a.approval_status === "반려");
  const safetyRow = apprs.find((a) => a.approver_role === "안전전담자");
  const repRow = apprs.find((a) => a.approver_role === "소장대표");

  const safetyOk = safetyRow ? safetyRow.approval_status === "승인" : false;
  const repRequired = !!rec.require_representative_approval;
  const repOk = repRequired ? !!repRow && repRow.approval_status === "승인" : true;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (anyRejected) {
    patch.status = "반려";
  } else if (safetyRow) {
    // 전자확인이 구성된 신규 TBM
    if (attendeesDone && safetyOk && repOk) {
      const approverNames = [safetyRow.approver_name, repRow?.approver_name].filter(Boolean);
      patch.status = "완료";
      patch.locked_at = new Date().toISOString();
      patch.approved_at = new Date().toISOString();
      patch.approved_by = approverNames.join(" / ") || "전자확인";
    } else if (attendeesDone) {
      patch.status = "검토중";
    } else {
      patch.status = "서명중";
    }
  } else {
    // 레거시(전자확인 미구성) — 기존 동작 유지
    patch.status = attendeesDone ? "검토중" : "서명중";
  }

  await admin.from("tbm_records").update(patch).eq("id", tbmRecordId);
}

type VerifyResult =
  | {
      ok: true;
      approval: {
        id: string;
        tbm_record_id: string;
        approver_role: string;
        approver_employee_id: string | null;
        approval_status: string;
      };
    }
  | { ok: false; error: string; status: number };

/**
 * 승인 토큰 + 이름 + 전화번호 뒷자리로 승인자 본인을 서버에서 검증한다.
 * - 지정된 approver_employee_id의 employees 레코드만 조회 (전체 직원 목록 노출 없음)
 * - 이름 일치 + 전화번호 마지막 4자리 일치
 */
export async function verifyTbmApprover(
  admin: Admin,
  approvalToken: string,
  name: string,
  phoneLast4: string
): Promise<VerifyResult> {
  if (!approvalToken || !name?.trim() || !phoneLast4 || !/^\d{4}$/.test(phoneLast4)) {
    return { ok: false, error: "invalid_input", status: 400 };
  }

  const { data: approval } = await admin
    .from("tbm_approvals")
    .select("id, tbm_record_id, approver_role, approver_employee_id, approval_status")
    .eq("approval_token", approvalToken)
    .single();

  if (!approval) return { ok: false, error: "not_found", status: 404 };
  if (!approval.approver_employee_id) {
    // 지정 직원이 없으면 전자확인 불가
    return { ok: false, error: "no_approver", status: 400 };
  }

  const { data: emp } = await admin
    .from("employees")
    .select("name, phone")
    .eq("id", approval.approver_employee_id)
    .single();

  if (!emp) return { ok: false, error: "not_found", status: 404 };

  const nameMatches = normalizeName(emp.name) === normalizeName(name);
  const phoneTail = (emp.phone ?? "").replace(/\D/g, "").slice(-4);
  const phoneMatches = phoneTail.length === 4 && phoneTail === phoneLast4;

  if (!nameMatches || !phoneMatches) {
    return { ok: false, error: "not_found", status: 404 };
  }

  return { ok: true, approval };
}
