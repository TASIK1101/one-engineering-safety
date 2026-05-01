import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// POST /api/duplicate-training
// body: { trainingId: string }
// 기존 교육을 복사해 오늘 날짜의 새 교육으로 생성 (작업 전 안전교육 전용)
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { trainingId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { trainingId } = body;
  if (!trainingId) {
    return NextResponse.json({ error: "trainingId required" }, { status: 400 });
  }

  // 원본 교육 조회 (본인 소유 확인)
  const { data: source, error: fetchErr } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .eq("admin_id", user.id)
    .single();

  if (fetchErr || !source) {
    return NextResponse.json(
      { error: "Training not found" },
      { status: 404 }
    );
  }

  const today = todayStr();

  // 새 교육 데이터 구성 (id, created_at 제외, 날짜만 오늘로 교체)
  const newTraining: Record<string, unknown> = {
    admin_id: user.id,
    title: `${today} 작업 전 안전교육`,
    description: source.description,
    content: source.content,
    quizzes: source.quizzes,
    training_type: source.training_type ?? "pre_work_training",
    work_date: today,
    work_name: source.work_name,
    work_location: source.work_location,
    risk_factors: source.risk_factors,
    ppe_check: source.ppe_check,
    daily_notice: source.daily_notice,
    instructor: source.instructor,
  };

  const { data: created, error: insertErr } = await supabase
    .from("trainings")
    .insert(newTraining)
    .select("id")
    .single();

  if (insertErr || !created) {
    return NextResponse.json(
      { error: "Failed to create training: " + insertErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: created.id });
}
