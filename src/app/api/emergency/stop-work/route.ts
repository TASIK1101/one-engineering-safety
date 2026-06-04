import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.occurred_at || !body.worksite_location?.trim() || !body.reporter_name?.trim() || !body.stop_reason?.trim()) {
    return NextResponse.json({ error: "required_fields_missing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stop_work_records")
    .insert({
      admin_id: user.id,
      created_by: user.id,
      occurred_at: body.occurred_at,
      worksite_location: body.worksite_location.trim(),
      work_type: body.work_type?.trim() || null,
      reporter_name: body.reporter_name.trim(),
      stop_reason: body.stop_reason.trim(),
      hazard_description: body.hazard_description?.trim() || null,
      immediate_action: body.immediate_action?.trim() || null,
      corrective_action: body.corrective_action?.trim() || null,
      photo_urls: Array.isArray(body.photo_urls) ? body.photo_urls : [],
      status: "작업중지",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
