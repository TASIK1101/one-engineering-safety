import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

function isColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return e.code === "42703" || (e.message?.includes("does not exist") ?? false);
}

export async function POST(req: NextRequest) {
  let step = "init";
  try {
    // ── 1. 입력 파싱 ──────────────────────────────────────────
    step = "parse_body";
    const body = await req.json();
    const { trainingId, name, phoneLast4 } = body as {
      trainingId: string;
      name: string;
      phoneLast4: string;
    };

    console.log(`[verify-employee] 요청: trainingId=${trainingId}, name=${name}, phoneLast4=${phoneLast4}`);

    if (!trainingId || !name?.trim() || !phoneLast4 || !/^\d{4}$/.test(phoneLast4)) {
      console.warn("[verify-employee] 입력값 유효성 실패");
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    // ── 2. admin 클라이언트 생성 ──────────────────────────────
    step = "create_admin_client";
    const supabase = createAdminClient();
    console.log("[verify-employee] admin 클라이언트 생성 성공");

    // ── 3. 교육 조회 ──────────────────────────────────────────
    step = "fetch_training";
    const { data: training, error: trainingError } = await supabase
      .from("trainings")
      .select("id, admin_id")
      .eq("id", trainingId)
      .single();

    if (trainingError || !training) {
      console.error(`[verify-employee] 교육 조회 실패: ${JSON.stringify(trainingError)}`);
      return NextResponse.json({ error: "training_not_found" }, { status: 404 });
    }
    console.log(`[verify-employee] 교육 조회 성공: admin_id=${training.admin_id}`);

    // ── 4. 직원 조회 ──────────────────────────────────────────
    step = "fetch_employee";
    const { data: candidates, error: empError } = await supabase
      .from("employees")
      .select("id, name, phone, department")
      .eq("admin_id", training.admin_id)
      .eq("name", name.trim());

    if (empError) {
      console.error(`[verify-employee] 직원 조회 DB 오류: ${JSON.stringify(empError)}`);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    console.log(`[verify-employee] 이름 매칭 직원 수: ${candidates?.length ?? 0}`);

    if (!candidates?.length) {
      console.warn(`[verify-employee] 이름 매칭 없음: name=${name}`);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // ── 5. 전화번호 뒷자리 매칭 ──────────────────────────────
    step = "match_phone";
    const matched = candidates.find(
      (emp) => emp.phone.replace(/\D/g, "").slice(-4) === phoneLast4
    );

    if (!matched) {
      console.warn(
        `[verify-employee] 전화번호 뒷자리 불일치: phoneLast4=${phoneLast4}, ` +
        `후보들=${candidates.map((e) => e.phone.replace(/\D/g, "").slice(-4)).join(",")}`
      );
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    console.log(`[verify-employee] 직원 매칭 성공: employee_id=${matched.id}`);

    const now = new Date().toISOString();

    // ── 6. assignment 조회 (employee_id + training_id 기준) ──
    step = "fetch_assignment";
    const { data: existing, error: assignError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("training_id", trainingId)
      .eq("employee_id", matched.id)
      .maybeSingle();

    if (assignError) {
      console.error(`[verify-employee] assignment 조회 오류: ${JSON.stringify(assignError)}`);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    console.log(`[verify-employee] assignment 조회 결과: ${existing ? `status=${existing.status}` : "없음"}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let assignment: any;

    if (!existing) {
      // ── 7a. 신규 assignment 생성 ────────────────────────────
      step = "insert_assignment";
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
          console.warn(`[verify-employee] started_at 컬럼 없음, fallback insert: ${JSON.stringify(insertError)}`);
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
            console.error(`[verify-employee] fallback insert 실패: ${JSON.stringify(fallbackErr)}`);
            return NextResponse.json({ error: "server_error" }, { status: 500 });
          }
          assignment = fallback;
        } else {
          console.error(`[verify-employee] assignment insert 오류: ${JSON.stringify(insertError)}`);
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }
      } else {
        assignment = created;
        console.log(`[verify-employee] 신규 assignment 생성: id=${assignment.id}`);
      }
    } else if (existing.status === "pending") {
      // ── 7b. 기존 미이수 → started_at 갱신 ──────────────────
      step = "update_assignment";
      const { data: updated, error: updateError } = await supabase
        .from("training_assignments")
        .update({ started_at: now })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        if (isColumnError(updateError)) {
          console.warn(`[verify-employee] started_at 컬럼 없음, update 건너뜀: ${JSON.stringify(updateError)}`);
          assignment = existing;
        } else {
          console.error(`[verify-employee] assignment update 오류: ${JSON.stringify(updateError)}`);
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }
      } else {
        assignment = updated;
        console.log(`[verify-employee] started_at 갱신: id=${assignment.id}`);
      }
    } else {
      // ── 7c. 이미 이수 완료 ───────────────────────────────────
      assignment = existing;
      console.log(`[verify-employee] 이미 완료: id=${assignment.id}`);
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
    console.error(`[verify-employee] 예외 발생 (step=${step}):`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
