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

    const { permitId, role, employeeId } = (await req.json()) as {
      permitId: string;
      role: string;
      employeeId: string;
    };

    if (!permitId || !role || !employeeId) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (!APPROVAL_ROLES.includes(role as (typeof APPROVAL_ROLES)[number])) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. 허가서 소유권 확인 + 잠금 상태 확인
    const { data: permit } = await admin
      .from("work_permits")
      .select("id, admin_id, status, locked_at")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // 완료/반려/작업중지/잠금 문서는 읽기 전용 — 담당자 변경 금지
    if (
      permit.locked_at ||
      permit.status === "승인완료" ||
      permit.status === "작업중지" ||
      permit.status === "반려"
    ) {
      return NextResponse.json({ error: "permit_locked" }, { status: 409 });
    }

    // 2. 지정할 직원이 본인 소유인지 검증 (임의 직원 자동연결 방지)
    const { data: emp } = await admin
      .from("employees")
      .select("id, name")
      .eq("id", employeeId)
      .eq("admin_id", user.id)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "invalid_employee" }, { status: 400 });
    }

    // 3. 해당 역할의 승인 row 조회
    const { data: approval } = await admin
      .from("work_permit_approvals")
      .select("id, approval_status, approval_token")
      .eq("permit_id", permitId)
      .eq("approver_role", role)
      .maybeSingle();

    // 4. 대기 상태인 역할만 지정/변경 가능 (승인/반려 완료 row는 수정 금지)
    if (approval && approval.approval_status !== "대기") {
      return NextResponse.json({ error: "already_processed" }, { status: 409 });
    }

    if (approval) {
      // 기존 대기 row 업데이트 (approval_token 없으면 보존 위해 그대로 두되, 없으면 생성)
      const updatePayload: Record<string, unknown> = {
        approver_employee_id: emp.id,
        approver_name: emp.name,
      };
      if (!approval.approval_token) {
        updatePayload.approval_token = crypto.randomUUID();
      }
      const { error: updErr } = await admin
        .from("work_permit_approvals")
        .update(updatePayload)
        .eq("id", approval.id);
      if (updErr) {
        console.error("[assign-approver] update:", updErr);
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }
    } else {
      // 역할 row 자체가 없으면 생성 (approval_token은 DB default로 생성)
      const { error: insErr } = await admin.from("work_permit_approvals").insert({
        permit_id: permitId,
        approver_role: role,
        approver_employee_id: emp.id,
        approver_name: emp.name,
        approval_status: "대기",
      });
      if (insErr) {
        console.error("[assign-approver] insert:", insErr);
        return NextResponse.json({ error: "insert_failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assign-approver] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
