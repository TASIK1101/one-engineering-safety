import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/confirm-training
// body: { trainingId, confirmedBy, confirmationMemo }
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    trainingId: string;
    confirmedBy: string;
    confirmationMemo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { trainingId, confirmedBy, confirmationMemo } = body;
  if (!trainingId || !confirmedBy?.trim()) {
    return NextResponse.json(
      { error: "trainingId and confirmedBy required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("trainings")
    .update({
      confirmed_at: new Date().toISOString(),
      confirmed_by: confirmedBy.trim(),
      confirmation_memo: confirmationMemo?.trim() ?? null,
    })
    .eq("id", trainingId)
    .eq("admin_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to confirm: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
