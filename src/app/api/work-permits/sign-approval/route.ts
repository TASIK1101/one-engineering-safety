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
      permitId,
      action,
      role,
      approverName,
      signatureData,
      rejectionReason,
    } = (await req.json()) as {
      permitId: string;
      action: "approve" | "reject";
      role: string;
      approverName?: string;
      signatureData?: string;
      rejectionReason?: string;
    };

    if (!permitId || !action || !role) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 허가서 소유권 확인
    const { data: permit, error: permitError } = await admin
      .from("work_permits")
      .select("status, admin_id")
      .eq("id", permitId)
      .single();

    if (permitError || !permit) {
      console.error("[sign-approval] permit lookup:", permitError);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 해당 역할의 기존 행을 permit_id + approver_role 기준으로 조회
    // (중복이 있다면 가장 오래된 것을 기준 행으로 사용)
    const { data: existing } = await admin
      .from("work_permit_approvals")
      .select("id")
      .eq("permit_id", permitId)
      .eq("approver_role", role)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (action === "approve") {
      if (!approverName?.trim()) {
        return NextResponse.json({ error: "approver_name_required" }, { status: 400 });
      }
      if (!signatureData) {
        return NextResponse.json({ error: "signature_required" }, { status: 400 });
      }

      const approvePayload = {
        approver_name: approverName.trim(),
        approval_status: "승인",
        signature_data: signatureData,
        approved_at: now,
      };

      if (existing) {
        const { error } = await admin
          .from("work_permit_approvals")
          .update(approvePayload)
          .eq("id", existing.id);
        if (error) {
          console.error("[sign-approval] update approve:", error);
          return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
        }
      } else {
        const { error } = await admin
          .from("work_permit_approvals")
          .insert({ permit_id: permitId, approver_role: role, ...approvePayload });
        if (error) {
          console.error("[sign-approval] insert approve:", error);
          return NextResponse.json({ error: "insert_failed", detail: error.message }, { status: 500 });
        }
      }

      // 3개 역할 전부 승인되면 허가서 상태를 승인완료로 변경
      const { data: allApprovals } = await admin
        .from("work_permit_approvals")
        .select("approver_role, approval_status")
        .eq("permit_id", permitId)
        .in("approver_role", APPROVAL_ROLES);

      const allApproved = APPROVAL_ROLES.every((r) =>
        allApprovals?.some((a) => a.approver_role === r && a.approval_status === "승인")
      );

      if (allApproved) {
        const { error: statusErr } = await admin
          .from("work_permits")
          .update({
            status: "승인완료",
            approved_by: approverName.trim(),
            approved_at: now,
            updated_at: now,
          })
          .eq("id", permitId);
        if (statusErr) {
          console.error("[sign-approval] status update:", statusErr);
        }
      }
    } else {
      // action === "reject"
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: "reason_required" }, { status: 400 });
      }

      const rejectPayload = {
        approver_name: approverName?.trim() || "",
        approval_status: "반려",
        approved_at: now,
      };

      if (existing) {
        const { error } = await admin
          .from("work_permit_approvals")
          .update(rejectPayload)
          .eq("id", existing.id);
        if (error) {
          console.error("[sign-approval] update reject:", error);
          return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
        }
      } else {
        const { error } = await admin
          .from("work_permit_approvals")
          .insert({ permit_id: permitId, approver_role: role, ...rejectPayload });
        if (error) {
          console.error("[sign-approval] insert reject:", error);
          return NextResponse.json({ error: "insert_failed", detail: error.message }, { status: 500 });
        }
      }

      // 허가서를 반려 처리
      const { error: permitUpdateErr } = await admin
        .from("work_permits")
        .update({
          status: "반려",
          rejection_reason: rejectionReason.trim(),
          updated_at: now,
        })
        .eq("id", permitId);
      if (permitUpdateErr) {
        console.error("[sign-approval] permit reject update:", permitUpdateErr);
        return NextResponse.json({ error: "update_failed", detail: permitUpdateErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sign-approval] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
