import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPermitApprover, recomputePermitStatus } from "@/lib/work-permit";

export async function POST(req: NextRequest) {
  try {
    const {
      approvalToken,
      name,
      phoneLast4,
      signatureData,
      action,
      rejectionReason,
    } = (await req.json()) as {
      approvalToken: string;
      name: string;
      phoneLast4: string;
      signatureData?: string;
      action: "approve" | "reject";
      rejectionReason?: string;
    };

    if (!approvalToken || !name?.trim() || !/^\d{4}$/.test(phoneLast4 ?? "")) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    if (action === "approve" && !signatureData) {
      return NextResponse.json({ error: "signature_required" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return NextResponse.json({ error: "reason_required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 서버에서 신원 재검증
    const verified = await verifyPermitApprover(
      admin,
      approvalToken,
      name,
      phoneLast4
    );

    if (!verified.ok) {
      return NextResponse.json({ error: verified.reason }, { status: 403 });
    }

    if (verified.alreadyDone) {
      return NextResponse.json({ error: "already_done" }, { status: 409 });
    }

    // 허가서 상태 확인 — 이미 잠긴 경우 차단
    const { data: permit } = await admin
      .from("work_permits")
      .select("status")
      .eq("id", verified.permitId)
      .single();

    if (!permit) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (permit.status === "승인완료" || permit.status === "작업중지") {
      return NextResponse.json({ error: "permit_locked" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;

    const updatePayload =
      action === "approve"
        ? {
            approval_status: "승인" as const,
            approver_name: verified.approverName,
            signature_data: signatureData,
            approved_at: now,
            signed_ip: ip,
            signed_user_agent: ua,
          }
        : {
            approval_status: "반려" as const,
            approver_name: verified.approverName,
            rejection_reason: rejectionReason!.trim(),
            approved_at: now,
            signed_ip: ip,
            signed_user_agent: ua,
          };

    const { error: updateErr } = await admin
      .from("work_permit_approvals")
      .update(updatePayload)
      .eq("id", verified.approvalId);

    if (updateErr) {
      console.error("[work-permits/approval/sign] update:", updateErr);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    await recomputePermitStatus(admin, verified.permitId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/approval/sign] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
