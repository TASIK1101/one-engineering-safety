import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  id: string;
  action: "approve" | "reject";
  approved_by?: string;
  rejection_reason?: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as RequestBody;
    const { id, action, approved_by, rejection_reason } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    let updatePayload: Record<string, unknown>;

    if (action === "approve") {
      const now = new Date().toISOString();
      updatePayload = {
        status: "완료",
        approved_by: approved_by ?? null,
        approved_at: now,
        completed_at: now,
        updated_at: now,
      };
    } else {
      updatePayload = {
        status: "반려",
        rejection_reason: rejection_reason ?? null,
        updated_at: new Date().toISOString(),
      };
    }

    const { error } = await admin
      .from("corrective_actions")
      .update(updatePayload)
      .eq("id", id)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[corrective-actions/approve]", error);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[corrective-actions/approve] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
