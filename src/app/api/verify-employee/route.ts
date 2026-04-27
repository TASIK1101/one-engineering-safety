import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trainingId, name, phoneLast4 } = body as {
      trainingId: string;
      name: string;
      phoneLast4: string;
    };

    if (
      !trainingId ||
      !name?.trim() ||
      !phoneLast4 ||
      !/^\d{4}$/.test(phoneLast4)
    ) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 교육 조회 (admin_id 확인용)
    const { data: training, error: trainingError } = await supabase
      .from("trainings")
      .select("id, admin_id")
      .eq("id", trainingId)
      .single();

    if (trainingError || !training) {
      console.error("Training lookup error:", trainingError);
      return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    }

    // 같은 관리자 소속 직원 중 이름 일치 후보 검색
    const { data: candidates, error: empError } = await supabase
      .from("employees")
      .select("id, name, phone, department")
      .eq("admin_id", training.admin_id)
      .eq("name", name.trim());

    if (empError) {
      console.error("Employee lookup error:", empError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!candidates?.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 서버에서 전화번호 뒷자리 매칭
    const matched = candidates.find(
      (emp) => emp.phone.replace(/\D/g, "").slice(-4) === phoneLast4
    );

    if (!matched) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 기존 assignment 조회
    const { data: existing, error: assignError } = await supabase
      .from("training_assignments")
      .select("id, status")
      .eq("training_id", trainingId)
      .eq("employee_id", matched.id)
      .maybeSingle();

    if (assignError) {
      console.error("Assignment lookup error:", assignError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    let assignment = existing;

    if (!assignment) {
      // 신규 assignment 생성 (service role — RLS 우회)
      const { data: created, error: insertError } = await supabase
        .from("training_assignments")
        .insert({
          training_id: trainingId,
          employee_id: matched.id,
          token: uuidv4(),
          status: "pending",
        })
        .select("id, status")
        .single();

      if (insertError || !created) {
        console.error("Assignment insert error:", insertError);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }

      assignment = created;
    }

    return NextResponse.json({
      employee: {
        id: matched.id,
        name: matched.name,
        department: matched.department ?? "",
      },
      assignment: {
        id: assignment.id,
        status: assignment.status,
      },
    });
  } catch (err) {
    console.error("verify-employee unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
