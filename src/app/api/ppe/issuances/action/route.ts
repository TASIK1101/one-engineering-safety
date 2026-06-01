import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcReplacementDate } from "@/lib/ppe";

type ActionType = "반납" | "교체" | "분실" | "폐기";

type Body = {
  issuanceId: string;
  action: ActionType;
  actionDate?: string; // YYYY-MM-DD (반납일/교체일 등)
  actorName?: string;
  note?: string;
};

const STATUS_BY_ACTION: Record<ActionType, string> = {
  반납: "반납완료",
  교체: "교체완료",
  분실: "분실",
  폐기: "폐기",
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as Body;
    if (!body.issuanceId || !body.action) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (!STATUS_BY_ACTION[body.action]) {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 대상 지급 내역 + 소유권 확인
    const { data: issuance } = await admin
      .from("ppe_issuances")
      .select("*")
      .eq("id", body.issuanceId)
      .single();

    if (!issuance || issuance.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (issuance.status !== "지급중") {
      return NextResponse.json({ error: "not_active", detail: `현재 상태: ${issuance.status}` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const actionDate = body.actionDate || now.substring(0, 10);
    const newStatus = STATUS_BY_ACTION[body.action];

    // 상태 패치 (액션별 날짜 컬럼)
    const patch: Record<string, unknown> = { status: newStatus, updated_at: now };
    if (body.action === "반납") patch.returned_at = actionDate;
    if (body.action === "교체") patch.replaced_at = actionDate;

    const { error: updErr } = await admin
      .from("ppe_issuances")
      .update(patch)
      .eq("id", body.issuanceId);
    if (updErr) {
      console.error("[ppe/action] update:", updErr);
      return NextResponse.json({ error: "update_failed", detail: updErr.message }, { status: 500 });
    }

    // 이력 기록
    await admin.from("ppe_issue_history").insert({
      issuance_id: body.issuanceId,
      action_type: body.action,
      action_date: now,
      actor_name: body.actorName?.trim() || null,
      note: body.note?.trim() || null,
    });

    // 교체: 새 지급 내역 자동 생성 (동일 직원·품목)
    let newIssuanceId: string | null = null;
    if (body.action === "교체") {
      const { data: item } = await admin
        .from("ppe_items")
        .select("replacement_cycle_months")
        .eq("id", issuance.ppe_item_id)
        .single();

      const expected = calcReplacementDate(actionDate, item?.replacement_cycle_months ?? null);

      const { data: newIss, error: newErr } = await admin
        .from("ppe_issuances")
        .insert({
          admin_id: user.id,
          employee_id: issuance.employee_id,
          ppe_item_id: issuance.ppe_item_id,
          issued_at: actionDate,
          quantity: issuance.quantity,
          status: "지급중",
          expected_replacement_date: expected || null,
          issue_reason: "교체 지급",
          note: body.note?.trim() || null,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (newErr) {
        console.error("[ppe/action] replacement insert:", newErr);
        return NextResponse.json({ error: "replacement_failed", detail: newErr.message }, { status: 500 });
      }
      newIssuanceId = newIss?.id ?? null;
      if (newIssuanceId) {
        await admin.from("ppe_issue_history").insert({
          issuance_id: newIssuanceId,
          action_type: "지급",
          actor_name: body.actorName?.trim() || null,
          note: "교체로 인한 신규 지급",
        });
      }
    }

    return NextResponse.json({ ok: true, newIssuanceId });
  } catch (err) {
    console.error("[ppe/action] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
