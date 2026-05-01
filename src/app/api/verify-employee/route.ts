import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

function isColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === "42703" ||
    (e.message?.includes("does not exist") ?? false)
  );
}

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

    // 교육 조회 - select("*") 로 컬럼 유무에 관계없이 안전하게 조회
    const { data: training, error: trainingError } = await supabase
      .from("trainings")
      .select("id, admin_id")
      .eq("id", trainingId)
      .single();

    if (trainingError || !training) {
      console.error("[verify-employee] Training lookup error:", JSON.stringify(trainingError));
      return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    }

    // 직원 조회
    const { data: candidates, error: empError } = await supabase
      .from("employees")
      .select("id, name, phone, department")
      .eq("admin_id", training.admin_id)
      .eq("name", name.trim());

    if (empError) {
      console.error("[verify-employee] Employee lookup error:", JSON.stringify(empError));
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    if (!candidates?.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const matched = candidates.find(
      (emp) => emp.phone.replace(/\D/g, "").slice(-4) === phoneLast4
    );

    if (!matched) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // assignment 조회 - select("*") 사용: 컬럼이 없어도 SELECT 자체는 성공
    const { data: existing, error: assignError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("training_id", trainingId)
      .eq("employee_id", matched.id)
      .maybeSingle();

    if (assignError) {
      console.error("[verify-employee] Assignment lookup error:", JSON.stringify(assignError));
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let assignment: any;

    if (!existing) {
      // 신규 assignment 생성 - started_at 포함 시도, 없으면 fallback
      const { data: created, error: insertError } = await supabase
        .from("training_assignments")
        .insert({
          training_id: trainingId,
          employee_id: matched.id,
          token: uuidv4(),
          status: "pending",
          started_at: now,
        })
        .select("*")
        .single();

      if (insertError) {
        if (isColumnError(insertError)) {
          // started_at 컬럼이 없을 경우 fallback: 기본 컬럼만으로 생성
          console.warn("[verify-employee] started_at 컬럼 없음, fallback insert 시도");
          const { data: fallback, error: fallbackErr } = await supabase
            .from("training_assignments")
            .insert({
              training_id: trainingId,
              employee_id: matched.id,
              token: uuidv4(),
              status: "pending",
            })
            .select("*")
            .single();

          if (fallbackErr || !fallback) {
            console.error("[verify-employee] Fallback insert error:", JSON.stringify(fallbackErr));
            return NextResponse.json({ error: "server_error" }, { status: 500 });
          }
          assignment = fallback;
        } else {
          console.error("[verify-employee] Assignment insert error:", JSON.stringify(insertError));
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }
      } else {
        assignment = created;
      }
    } else if (existing.status === "pending") {
      // 기존 미이수 → started_at 갱신 시도, 없으면 현상 유지
      const { data: updated, error: updateError } = await supabase
        .from("training_assignments")
        .update({ started_at: now })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        if (isColumnError(updateError)) {
          console.warn("[verify-employee] started_at 컬럼 없음, update 건너뜀");
          assignment = existing;
        } else {
          console.error("[verify-employee] Assignment update error:", JSON.stringify(updateError));
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }
      } else {
        assignment = updated;
      }
    } else {
      // 이미 이수 완료
      assignment = existing;
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
        started_at: assignment.started_at ?? null,
        completed_at: assignment.completed_at ?? null,
        quiz_answers: assignment.quiz_answers ?? null,
      },
    });
  } catch (err) {
    console.error("[verify-employee] Unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
