import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { permitToken, name, phoneLast4 } = (await req.json()) as {
      permitToken: string;
      name: string;
      phoneLast4: string;
    };

    if (!permitToken || !name?.trim() || !phoneLast4 || !/^\d{4}$/.test(phoneLast4)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. permit_token으로 허가서 조회
    const { data: permit } = await admin
      .from("work_permits")
      .select("id, status")
      .eq("permit_token", permitToken)
      .single();

    if (!permit) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 2. 허가서에 등록된 작업 인원 조회
    const { data: workers } = await admin
      .from("work_permit_workers")
      .select("id, employee_id, worker_name, phone_last4, is_manual, signed_at")
      .eq("permit_id", permit.id);

    if (!workers?.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 3. employee_id가 있는 인원의 전화번호 조회
    const employeeIds = workers
      .map((w) => w.employee_id)
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
    const matched = workers.find((w) => {
      // 직접입력 작업자: work_permit_workers.phone_last4 기준 검증
      if (w.is_manual) {
        const nameMatch = normalizeName(w.worker_name) === inputName;
        if (!nameMatch) return false;
        return w.phone_last4 === phoneLast4;
      }
      // employees 테이블 기반 작업자
      if (!w.employee_id || !employeeMap.has(w.employee_id)) return false;
      const emp = employeeMap.get(w.employee_id)!;
      const nameMatch = normalizeName(emp.name) === inputName;
      if (!nameMatch) return false;
      const phoneTail = emp.phone.replace(/\D/g, "").slice(-4);
      return phoneTail === phoneLast4;
    });

    if (!matched) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 5. 이미 서명한 인원 확인
    if (matched.signed_at) {
      return NextResponse.json({ error: "already_signed" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, workerId: matched.id });
  } catch (err) {
    console.error("[work-permits/verify-worker] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
