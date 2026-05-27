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

    const { permitId, reason } = (await req.json()) as {
      permitId: string;
      reason?: string;
    };

    if (!permitId) {
      return NextResponse.json({ error: "permitId required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("work_permits")
      .update({
        status: "작업중지",
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", permitId)
      .eq("admin_id", user.id)
      .eq("status", "승인완료");

    if (error) {
      console.error("[work-permits/stop]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/stop] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
