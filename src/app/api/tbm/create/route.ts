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

    const body = await req.json();
    const {
      date,
      company,
      worksite_location,
      work_type,
      process_name,
      supervisor,
      safety_manager,
      site_manager,
      hazard_items,
      main_hazard_notes,
      accident_case_notes,
      education_done,
      attendee_employees,
    } = body as {
      date: string;
      company: string;
      worksite_location: string;
      work_type: string;
      process_name: string;
      supervisor: string;
      safety_manager: string;
      site_manager: string;
      hazard_items: string[];
      main_hazard_notes: string;
      accident_case_notes: string;
      education_done: boolean;
      attendee_employees: { employee_id: string | null; employee_name: string }[];
    };

    if (!date || !work_type) {
      return NextResponse.json(
        { error: "date and work_type required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: record, error: rErr } = await admin
      .from("tbm_records")
      .insert({
        admin_id: user.id,
        date,
        company: company || null,
        worksite_location: worksite_location || null,
        work_type,
        process_name: process_name || null,
        supervisor: supervisor || null,
        safety_manager: safety_manager || null,
        site_manager: site_manager || null,
        hazard_items: hazard_items ?? [],
        main_hazard_notes: main_hazard_notes || null,
        accident_case_notes: accident_case_notes || null,
        education_done: education_done ?? false,
        status: "서명중",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (rErr || !record) {
      console.error("[tbm/create]", rErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    if (attendee_employees && attendee_employees.length > 0) {
      const rows = attendee_employees.map((a) => ({
        tbm_record_id: record.id,
        employee_id: a.employee_id || null,
        employee_name: a.employee_name,
        attendance_status: "대기",
        signature_data: null,
        signed_at: null,
      }));
      const { error: aErr } = await admin.from("tbm_attendees").insert(rows);
      if (aErr) {
        console.error("[tbm/create] attendees insert error:", aErr);
        // 참석자 저장 실패 시 생성된 TBM 레코드 삭제 후 에러 반환
        await admin.from("tbm_records").delete().eq("id", record.id);
        return NextResponse.json({ error: "attendees_insert_failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ id: record.id });
  } catch (err) {
    console.error("[tbm/create] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
