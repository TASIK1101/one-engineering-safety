import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputePermitStatus } from "@/lib/work-permit";

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { permitId } = (await req.json()) as { permitId: string };
    if (!permitId) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 소유권 확인
    const { data: permit } = await admin
      .from("work_permits")
      .select("id, status, admin_id")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (permit.status === "작업중지") {
      return NextResponse.json({ error: "work_stopped" }, { status: 400 });
    }

    // 승인 row 전부 대기로 초기화
    const { error: resetErr } = await admin
      .from("work_permit_approvals")
      .update({
        approval_status: "대기",
        signature_data: null,
        rejection_reason: null,
        approved_at: null,
        signed_ip: null,
        signed_user_agent: null,
      })
      .eq("permit_id", permitId);

    if (resetErr) {
      console.error("[work-permits/reopen] reset approvals:", resetErr);
      return NextResponse.json({ error: "reset_failed" }, { status: 500 });
    }

    // permit 잠금 해제 + 반려 사유 초기화
    const { error: unlockErr } = await admin
      .from("work_permits")
      .update({
        locked_at: null,
        rejection_reason: null,
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", permitId);

    if (unlockErr) {
      console.error("[work-permits/reopen] unlock:", unlockErr);
      return NextResponse.json({ error: "unlock_failed" }, { status: 500 });
    }

    await recomputePermitStatus(admin, permitId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/reopen] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
