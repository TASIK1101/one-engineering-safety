import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { assignmentId, quizAnswers, signatureData, consentChecked } = body as {
      assignmentId: string;
      quizAnswers: ("O" | "X")[];
      signatureData: string;
      consentChecked: boolean;
    };

    if (!assignmentId || !Array.isArray(quizAnswers) || !signatureData) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    if (!consentChecked) {
      return NextResponse.json({ error: "consent_required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // select("*") 로 컬럼 유무와 무관하게 안전하게 조회
    const { data: assignment, error: fetchError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error("[submit-training] Assignment fetch error:", JSON.stringify(fetchError));
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (assignment.status === "completed") {
      return NextResponse.json({ error: "already_completed" }, { status: 409 });
    }

    const now = new Date();
    const startedAt: string | null = assignment.started_at ?? null;
    const durationSeconds = startedAt
      ? Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
      : null;

    // 풀 업데이트 시도 (신규 컬럼 포함)
    const { error: updateError } = await supabase
      .from("training_assignments")
      .update({
        status: "completed",
        quiz_answers: quizAnswers,
        signature_data: signatureData,
        completed_at: now.toISOString(),
        duration_seconds: durationSeconds,
        consent_checked: true,
      })
      .eq("id", assignmentId);

    if (updateError) {
      if (isColumnError(updateError)) {
        // 신규 컬럼(completed_at, duration_seconds, consent_checked)이 없을 경우 fallback
        console.warn("[submit-training] 신규 컬럼 없음, fallback update 시도. error:", JSON.stringify(updateError));

        const { error: fallbackErr } = await supabase
          .from("training_assignments")
          .update({
            status: "completed",
            quiz_answers: quizAnswers,
            signature_data: signatureData,
          })
          .eq("id", assignmentId);

        if (fallbackErr) {
          console.error("[submit-training] Fallback update error:", JSON.stringify(fallbackErr));
          return NextResponse.json({ error: "server_error" }, { status: 500 });
        }

        console.warn("[submit-training] Fallback 성공. DB 마이그레이션 필요: completed_at, duration_seconds, consent_checked 컬럼 추가 필요");
      } else {
        console.error("[submit-training] Assignment update error:", JSON.stringify(updateError));
        return NextResponse.json({ error: "server_error" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[submit-training] Unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
