import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  id: string;
  action_result: string;
  after_photo_url?: string;
  assigned_to?: string;
  due_date?: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as RequestBody;
    const { id, action_result, after_photo_url, assigned_to, due_date } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!action_result) {
      return NextResponse.json({ error: "action_result is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const updatePayload: Record<string, unknown> = {
      action_result,
      status: "검토중",
      updated_at: new Date().toISOString(),
    };

    if (after_photo_url !== undefined) {
      updatePayload.after_photo_url = after_photo_url;
    }
    if (assigned_to !== undefined) {
      updatePayload.assigned_to = assigned_to;
    }
    if (due_date !== undefined) {
      updatePayload.due_date = due_date;
    }

    const { error } = await admin
      .from("corrective_actions")
      .update(updatePayload)
      .eq("id", id)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[corrective-actions/update]", error);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[corrective-actions/update] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
