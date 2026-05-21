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

    const { tbmId, action, approvedBy, rejectionReason } =
      (await req.json()) as {
        tbmId: string;
        action: "approve" | "reject";
        approvedBy: string;
        rejectionReason?: string;
      };

    if (!tbmId || !action) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    const updateData =
      action === "approve"
        ? {
            status: "완료",
            approved_by: approvedBy || "관리자",
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            status: "반려",
            rejection_reason: rejectionReason || null,
            updated_at: new Date().toISOString(),
          };

    const { error } = await admin
      .from("tbm_records")
      .update(updateData)
      .eq("id", tbmId)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[tbm/approve]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tbm/approve] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
