import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface WorkerInput {
  employee_id: string | null;
  worker_name: string;
  phone_last4?: string;
  company_name?: string;
  is_manual?: boolean;
}

interface ChecklistItemInput {
  category: string;
  item_text: string;
  apply_status: "신청" | "해당없음";
}

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      grade,
      permit_type,
      work_company,
      work_department,
      work_period_start,
      work_period_end,
      work_location,
      work_name,
      worker_count,
      supervisor_name,
      emergency_contact,
      ventilation_method,
      watcher_name,
      items,
      workers,
    } = body as {
      grade: "A" | "B";
      permit_type: string;
      work_company: string;
      work_department: string;
      work_period_start: string;
      work_period_end: string;
      work_location: string;
      work_name: string;
      worker_count: number;
      supervisor_name: string;
      emergency_contact: string;
      ventilation_method?: string;
      watcher_name?: string;
      items: ChecklistItemInput[];
      workers: WorkerInput[];
    };

    if (!grade || !permit_type) {
      return NextResponse.json({ error: "grade and permit_type required" }, { status: 400 });
    }

    const title = `${grade}급 작업허가서 — ${permit_type}`;
    const admin = createAdminClient();

    // 1. 작업허가서 생성
    const { data: permit, error: pErr } = await admin
      .from("work_permits")
      .insert({
        admin_id: user.id,
        grade,
        permit_type,
        title,
        work_company: work_company || null,
        work_department: work_department || null,
        work_period_start: work_period_start || null,
        work_period_end: work_period_end || null,
        work_location: work_location || null,
        work_name: work_name || null,
        worker_count: worker_count || null,
        supervisor_name: supervisor_name || null,
        emergency_contact: emergency_contact || null,
        ventilation_method: ventilation_method || null,
        watcher_name: watcher_name || null,
        status: "서명중",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (pErr || !permit) {
      console.error("[work-permits/create] permit insert:", pErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    // 2. 체크리스트 항목 삽입
    if (items && items.length > 0) {
      const itemRows = items.map((item) => ({
        permit_id: permit.id,
        category: item.category,
        item_text: item.item_text,
        apply_status: item.apply_status,
        field_confirmed: false,
      }));
      const { error: iErr } = await admin.from("work_permit_items").insert(itemRows);
      if (iErr) {
        console.error("[work-permits/create] items insert:", iErr);
        await admin.from("work_permits").delete().eq("id", permit.id);
        return NextResponse.json({ error: "items_insert_failed" }, { status: 500 });
      }
    }

    // 3. 작업 인원 삽입
    if (workers && workers.length > 0) {
      const workerRows = workers.map((w) => ({
        permit_id: permit.id,
        employee_id: w.employee_id || null,
        worker_name: w.worker_name,
        phone_last4: w.phone_last4 || null,
        company_name: w.company_name || null,
        is_manual: w.is_manual ?? false,
        signature_data: null,
        signed_at: null,
      }));
      const { error: wErr } = await admin.from("work_permit_workers").insert(workerRows);
      if (wErr) {
        console.error("[work-permits/create] workers insert:", wErr);
        await admin.from("work_permits").delete().eq("id", permit.id);
        return NextResponse.json({ error: "workers_insert_failed" }, { status: 500 });
      }
    }

    // 4. 승인 단계 3개 자동 생성 (작성자, 안전전담자, 소장대표)
    await admin.from("work_permit_approvals").insert([
      { permit_id: permit.id, approver_role: "작성자",    approver_name: "", approval_status: "대기" },
      { permit_id: permit.id, approver_role: "안전전담자", approver_name: "", approval_status: "대기" },
      { permit_id: permit.id, approver_role: "소장대표",  approver_name: "", approval_status: "대기" },
    ]);

    return NextResponse.json({ id: permit.id });
  } catch (err) {
    console.error("[work-permits/create] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
