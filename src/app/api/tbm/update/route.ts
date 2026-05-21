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
    const { tbmId, ...fields } = body as { tbmId: string; [key: string]: unknown };

    if (!tbmId) {
      return NextResponse.json({ error: "tbmId required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 반려된 TBM만 수정 허용
    const { data: rec } = await admin
      .from("tbm_records")
      .select("status, admin_id")
      .eq("id", tbmId)
      .single();

    if (!rec || rec.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (rec.status !== "반려") {
      return NextResponse.json(
        { error: "only_rejected_editable" },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("tbm_records")
      .update({
        ...fields,
        status: "서명중",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tbmId);

    if (error) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tbm/update]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
