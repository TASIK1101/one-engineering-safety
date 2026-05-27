import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { permitId, action, approvedBy, rejectionReason } = (await req.json()) as {
      permitId: string;
      action: "approve" | "reject" | "review";
      approvedBy?: string;
      rejectionReason?: string;
    };

    if (!permitId || !action) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 현재 상태 확인
    const { data: permit } = await admin
      .from("work_permits")
      .select("status, admin_id")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let updateData: Record<string, string | null>;

    if (action === "approve") {
      updateData = {
        status: "승인완료",
        approved_by: approvedBy || "관리자",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 승인 이력 기록
      await admin.from("work_permit_approvals").insert({
        permit_id: permitId,
        approver_role: "안전관리자",
        approver_name: approvedBy || "관리자",
        approval_status: "승인",
        approved_at: new Date().toISOString(),
      });
    } else if (action === "reject") {
      updateData = {
        status: "반려",
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      };
      await admin.from("work_permit_approvals").insert({
        permit_id: permitId,
        approver_role: "안전관리자",
        approver_name: approvedBy || "관리자",
        approval_status: "반려",
        approved_at: new Date().toISOString(),
      });
    } else {
      // review: 서명중 → 검토중
      updateData = {
        status: "검토중",
        updated_at: new Date().toISOString(),
      };
    }

    const { error } = await admin
      .from("work_permits")
      .update(updateData)
      .eq("id", permitId)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[work-permits/approve]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/approve] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
