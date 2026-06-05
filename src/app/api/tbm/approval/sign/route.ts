import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTbmApprover, recomputeTbmStatus } from "@/lib/tbm";

export async function POST(req: NextRequest) {
  try {
    const { approvalToken, name, phoneLast4, signatureData, action, rejectionReason } =
      (await req.json()) as {
        approvalToken: string;
        name: string;
        phoneLast4: string;
        signatureData?: string;
        action: "승인" | "반려";
        rejectionReason?: string;
      };

    if (action !== "승인" && action !== "반려") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
    if (action === "승인" && !signatureData) {
      return NextResponse.json({ error: "signature_required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 본인 재검증 (UI 우회 직접 호출 방지)
    const result = await verifyTbmApprover(admin, approvalToken, name, phoneLast4);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const approval = result.approval;

    if (approval.approval_status === "승인") {
      return NextResponse.json({ error: "already_approved" }, { status: 409 });
    }

    // 감사 로그 (IP / User-Agent)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent") ?? null;

    const { error: updErr } = await admin
      .from("tbm_approvals")
      .update({
        approval_status: action,
        signature_data: action === "승인" ? signatureData : null,
        rejection_reason: action === "반려" ? rejectionReason || null : null,
        approved_at: new Date().toISOString(),
        signed_ip: ip,
        signed_user_agent: ua,
      })
      .eq("id", approval.id);

    if (updErr) {
      console.error("[tbm/approval/sign]", updErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    await recomputeTbmStatus(admin, approval.tbm_record_id);

    return NextResponse.json({ ok: true, action });
  } catch (err) {
    console.error("[tbm/approval/sign] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
