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

    const { permitId, action } = (await req.json()) as {
      permitId: string;
      action: "review";
    };

    if (!permitId || action !== "review") {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: permit } = await admin
      .from("work_permits")
      .select("status, admin_id")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (permit.status !== "서명중") {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const { error } = await admin
      .from("work_permits")
      .update({ status: "검토중", updated_at: new Date().toISOString() })
      .eq("id", permitId)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[work-permits/approve]", error);
      return NextResponse.json({ error: "server_error", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/approve] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
