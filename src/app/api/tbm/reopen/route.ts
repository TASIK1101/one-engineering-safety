import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeTbmStatus } from "@/lib/tbm";

/**
 * 완료된 TBM의 전자확인을 무효화하고 다시 수정/재승인 가능한 상태로 되돌린다.
 * (승인 완료 후 수정하려면 기존 승인 무효화 및 재승인 절차)
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { tbmId } = (await req.json()) as { tbmId: string };
    if (!tbmId) return NextResponse.json({ error: "tbmId required" }, { status: 400 });

    const admin = createAdminClient();

    const { data: rec } = await admin
      .from("tbm_records")
      .select("admin_id")
      .eq("id", tbmId)
      .single();
    if (!rec || rec.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 전자확인 무효화
    await admin
      .from("tbm_approvals")
      .update({
        approval_status: "대기",
        signature_data: null,
        approved_at: null,
        rejection_reason: null,
        signed_ip: null,
        signed_user_agent: null,
      })
      .eq("tbm_record_id", tbmId);

    // 잠금 해제
    await admin
      .from("tbm_records")
      .update({
        locked_at: null,
        approved_at: null,
        approved_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tbmId);

    await recomputeTbmStatus(admin, tbmId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tbm/reopen]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
