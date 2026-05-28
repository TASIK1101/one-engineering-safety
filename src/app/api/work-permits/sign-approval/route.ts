import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const APPROVAL_ROLES = ["작성자", "안전전담자", "소장대표"] as const;

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const {
      approvalId,
      permitId,
      action,
      role,
      approverName,
      signatureData,
      rejectionReason,
    } = (await req.json()) as {
      approvalId?: string;
      permitId: string;
      action: "approve" | "reject";
      role: string;
      approverName: string;
      signatureData?: string;
      rejectionReason?: string;
    };

    if (!permitId || !action || !role) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 허가서 소유권 확인
    const { data: permit } = await admin
      .from("work_permits")
      .select("status, admin_id")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      if (!approverName?.trim()) {
        return NextResponse.json({ error: "approver_name_required" }, { status: 400 });
      }
      if (!signatureData) {
        return NextResponse.json({ error: "signature_required" }, { status: 400 });
      }

      if (approvalId) {
        // 기존 레코드 업데이트
        const { error } = await admin
          .from("work_permit_approvals")
          .update({
            approver_name: approverName.trim(),
            approval_status: "승인",
            signature_data: signatureData,
            approved_at: now,
          })
          .eq("id", approvalId)
          .eq("permit_id", permitId);
        if (error) {
          console.error("[sign-approval] update:", error);
          return NextResponse.json({ error: "update_failed" }, { status: 500 });
        }
      } else {
        // 레코드가 없으면 신규 생성
        const { error } = await admin.from("work_permit_approvals").insert({
          permit_id: permitId,
          approver_role: role,
          approver_name: approverName.trim(),
          approval_status: "승인",
          signature_data: signatureData,
          approved_at: now,
        });
        if (error) {
          console.error("[sign-approval] insert:", error);
          return NextResponse.json({ error: "insert_failed" }, { status: 500 });
        }
      }

      // 3개 역할 모두 승인 여부 확인
      const { data: allApprovals } = await admin
        .from("work_permit_approvals")
        .select("approver_role, approval_status")
        .eq("permit_id", permitId)
        .in("approver_role", APPROVAL_ROLES);

      const allApproved =
        APPROVAL_ROLES.every((r) =>
          allApprovals?.some(
            (a) => a.approver_role === r && a.approval_status === "승인"
          )
        );

      if (allApproved) {
        await admin
          .from("work_permits")
          .update({
            status: "승인완료",
            approved_by: approverName.trim(),
            approved_at: now,
            updated_at: now,
          })
          .eq("id", permitId);
      }
    } else {
      // action === "reject"
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: "reason_required" }, { status: 400 });
      }

      if (approvalId) {
        await admin
          .from("work_permit_approvals")
          .update({
            approver_name: approverName?.trim() || "",
            approval_status: "반려",
            approved_at: now,
          })
          .eq("id", approvalId)
          .eq("permit_id", permitId);
      } else {
        await admin.from("work_permit_approvals").insert({
          permit_id: permitId,
          approver_role: role,
          approver_name: approverName?.trim() || "",
          approval_status: "반려",
          approved_at: now,
        });
      }

      // 허가서를 반려 처리
      await admin
        .from("work_permits")
        .update({
          status: "반려",
          rejection_reason: rejectionReason.trim(),
          updated_at: now,
        })
        .eq("id", permitId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sign-approval] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
