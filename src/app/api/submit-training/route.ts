import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { data: assignment, error: fetchError } = await supabase
      .from("training_assignments")
      .select("id, status, started_at")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      console.error("Assignment fetch error:", fetchError);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (assignment.status === "completed") {
      return NextResponse.json({ error: "already_completed" }, { status: 409 });
    }

    const now = new Date();
    const durationSeconds = assignment.started_at
      ? Math.round((now.getTime() - new Date(assignment.started_at).getTime()) / 1000)
      : null;

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
      console.error("Assignment update error:", updateError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("submit-training unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
