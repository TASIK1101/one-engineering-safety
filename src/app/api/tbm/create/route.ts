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
      // ── 역할별 전자확인 설정 ──
      author_employee_id,
      author_is_safety_manager,
      safety_manager_employee_id,
      require_representative_approval,
      representative_employee_id,
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
      author_employee_id?: string | null;
      author_is_safety_manager?: boolean;
      safety_manager_employee_id?: string | null;
      require_representative_approval?: boolean;
      representative_employee_id?: string | null;
    };

    if (!date || !work_type) {
      return NextResponse.json(
        { error: "date and work_type required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── 전자확인 대상 직원 검증 (본인 소유 직원만 허용, 전체 목록 노출 없음) ──
    const isSameAuthor = author_is_safety_manager ?? true;
    const effectiveSafetyId = isSameAuthor
      ? author_employee_id || null
      : safety_manager_employee_id || null;
    const repRequired = !!require_representative_approval;
    const repId = repRequired ? representative_employee_id || null : null;

    // 대표 확인 필요인데 대표 미지정이면 막음 (완료 불가 상태 방지)
    if (repRequired && !repId) {
      return NextResponse.json({ error: "representative_required" }, { status: 400 });
    }
    // 안전전담자 동일 옵션인데 작성자 미지정 + 별도 안전전담자도 미지정이면 전자확인 없이 진행(레거시)

    const neededIds = [author_employee_id, effectiveSafetyId, repId].filter(
      (v): v is string => !!v
    );

    const empNameMap = new Map<string, string>();
    if (neededIds.length > 0) {
      const { data: emps } = await admin
        .from("employees")
        .select("id, name")
        .eq("admin_id", user.id)
        .in("id", neededIds);
      for (const e of emps ?? []) empNameMap.set(e.id, e.name);
      // 검증: 요청한 id가 모두 본인 소유 직원인지 확인
      for (const idv of neededIds) {
        if (!empNameMap.has(idv)) {
          return NextResponse.json({ error: "invalid_approver" }, { status: 400 });
        }
      }
    }

    // 전자확인 사용 여부: 안전전담자 직원이 지정된 경우에만 승인 row 생성
    const useEConfirm = !!effectiveSafetyId;

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
        // 텍스트 필드: 전자확인 직원이 지정되면 직원명으로 채움(없으면 입력값 유지)
        safety_manager:
          (effectiveSafetyId && empNameMap.get(effectiveSafetyId)) || safety_manager || null,
        site_manager: (repId && empNameMap.get(repId)) || site_manager || null,
        hazard_items: hazard_items ?? [],
        main_hazard_notes: main_hazard_notes || null,
        accident_case_notes: accident_case_notes || null,
        education_done: education_done ?? false,
        status: "서명중",
        created_by: user.id,
        author_employee_id: author_employee_id || null,
        safety_manager_employee_id: effectiveSafetyId,
        representative_employee_id: repId,
        author_is_safety_manager: isSameAuthor,
        require_representative_approval: repRequired,
      })
      .select("id")
      .single();

    if (rErr || !record) {
      console.error("[tbm/create]", rErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    // ── 참석자 ──
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
        await admin.from("tbm_records").delete().eq("id", record.id);
        return NextResponse.json({ error: "attendees_insert_failed" }, { status: 500 });
      }
    }

    // ── 역할별 전자확인 row 생성 ──
    if (useEConfirm) {
      const approvalRows: {
        tbm_record_id: string;
        approver_role: string;
        approver_employee_id: string;
        approver_name: string | null;
      }[] = [
        {
          tbm_record_id: record.id,
          approver_role: "안전전담자",
          approver_employee_id: effectiveSafetyId!,
          approver_name: empNameMap.get(effectiveSafetyId!) ?? null,
        },
      ];
      if (repRequired && repId) {
        approvalRows.push({
          tbm_record_id: record.id,
          approver_role: "소장대표",
          approver_employee_id: repId,
          approver_name: empNameMap.get(repId) ?? null,
        });
      }
      const { error: apErr } = await admin.from("tbm_approvals").insert(approvalRows);
      if (apErr) {
        console.error("[tbm/create] approvals insert error:", apErr);
        // 승인 row 실패는 치명적이지 않으나, 일관성을 위해 롤백
        await admin.from("tbm_records").delete().eq("id", record.id);
        return NextResponse.json({ error: "approvals_insert_failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ id: record.id });
  } catch (err) {
    console.error("[tbm/create] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
