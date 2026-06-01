import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcReplacementDate } from "@/lib/ppe";

type Body = {
  employee_id: string;
  ppe_item_id: string;
  issued_at: string;
  quantity?: number;
  issue_reason?: string;
  note?: string;
  expected_replacement_date?: string | null;
  actor_name?: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as Body;

    if (!body.employee_id) return NextResponse.json({ error: "employee_required" }, { status: 400 });
    if (!body.ppe_item_id) return NextResponse.json({ error: "item_required" }, { status: 400 });
    if (!body.issued_at) return NextResponse.json({ error: "issued_at_required" }, { status: 400 });

    const admin = createAdminClient();

    // 직원/품목 소유권 확인
    const [{ data: emp }, { data: item }] = await Promise.all([
      admin.from("employees").select("id, admin_id").eq("id", body.employee_id).single(),
      admin.from("ppe_items").select("id, admin_id, replacement_cycle_months").eq("id", body.ppe_item_id).single(),
    ]);

    if (!emp || emp.admin_id !== user.id) {
      return NextResponse.json({ error: "employee_not_found" }, { status: 404 });
    }
    if (!item || item.admin_id !== user.id) {
      return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    }

    // 교체 예정일: 입력값 우선, 없으면 품목 교체주기로 자동 계산
    const expected =
      body.expected_replacement_date ??
      calcReplacementDate(body.issued_at, item.replacement_cycle_months);

    const { data: issuance, error: issErr } = await admin
      .from("ppe_issuances")
      .insert({
        admin_id: user.id,
        employee_id: body.employee_id,
        ppe_item_id: body.ppe_item_id,
        issued_at: body.issued_at,
        quantity: body.quantity ?? 1,
        status: "지급중",
        expected_replacement_date: expected || null,
        issue_reason: body.issue_reason?.trim() || null,
        note: body.note?.trim() || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (issErr || !issuance) {
      console.error("[ppe/issue] insert:", issErr);
      return NextResponse.json({ error: "issue_failed", detail: issErr?.message }, { status: 500 });
    }

    // 지급 이력 기록
    const { error: histErr } = await admin.from("ppe_issue_history").insert({
      issuance_id: issuance.id,
      action_type: "지급",
      actor_name: body.actor_name?.trim() || null,
      note: body.issue_reason?.trim() || null,
    });
    if (histErr) {
      console.error("[ppe/issue] history:", histErr);
    }

    return NextResponse.json({ id: issuance.id });
  } catch (err) {
    console.error("[ppe/issue] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
