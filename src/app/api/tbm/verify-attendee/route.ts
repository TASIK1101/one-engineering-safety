import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 공백 제거 후 비교용 정규화 */
function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { signToken, name, phoneLast4 } = (await req.json()) as {
      signToken: string;
      name: string;
      phoneLast4: string;
    };

    // 입력값 검증
    if (
      !signToken ||
      !name?.trim() ||
      !phoneLast4 ||
      !/^\d{4}$/.test(phoneLast4)
    ) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. signToken으로 TBM 레코드 조회
    const { data: record } = await admin
      .from("tbm_records")
      .select("id")
      .eq("sign_token", signToken)
      .single();

    if (!record) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 2. 해당 TBM 참석자 전원 조회 (employee_id + employee_name 포함)
    const { data: attendees } = await admin
      .from("tbm_attendees")
      .select("id, employee_id, employee_name, attendance_status")
      .eq("tbm_record_id", record.id);

    if (!attendees?.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 3. employee_id가 있는 참석자들의 직원 정보 조회 (name + phone)
    const employeeIds = attendees
      .map((a) => a.employee_id)
      .filter(Boolean) as string[];

    const employeeMap = new Map<string, { name: string; phone: string }>();

    if (employeeIds.length > 0) {
      const { data: employees } = await admin
        .from("employees")
        .select("id, name, phone")
        .in("id", employeeIds);

      for (const emp of employees ?? []) {
        employeeMap.set(emp.id, { name: emp.name, phone: emp.phone });
      }
    }

    // 4. 이름 + 전화번호 뒷자리 동시 검증
    const inputName = normalizeName(name);
    const matchedAttendee = attendees.find((a) => {
      // 이름 일치 확인: employees.name 또는 tbm_attendees.employee_name
      let nameMatches = false;

      if (a.employee_id && employeeMap.has(a.employee_id)) {
        const emp = employeeMap.get(a.employee_id)!;
        nameMatches = normalizeName(emp.name) === inputName;
      }
      // employee_name으로도 fallback 비교
      if (!nameMatches && a.employee_name) {
        nameMatches = normalizeName(a.employee_name) === inputName;
      }

      if (!nameMatches) return false;

      // 전화번호 뒷자리 일치 확인
      if (a.employee_id && employeeMap.has(a.employee_id)) {
        const emp = employeeMap.get(a.employee_id)!;
        const phoneTail = emp.phone.replace(/\D/g, "").slice(-4);
        return phoneTail === phoneLast4;
      }

      return false;
    });

    if (!matchedAttendee) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 5. 이미 서명 완료 확인
    if (matchedAttendee.attendance_status === "서명완료") {
      return NextResponse.json({ error: "already_signed" }, { status: 409 });
    }

    // 6. 검증 성공 — attendeeId만 반환 (다른 정보 노출 없음)
    return NextResponse.json({ ok: true, attendeeId: matchedAttendee.id });
  } catch (err) {
    console.error("[tbm/verify-attendee]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
