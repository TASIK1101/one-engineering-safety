import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AttendeeInput = { employee_id?: string | null; employee_name: string; attended?: boolean; note?: string | null };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("emergency_drills")
    .select("admin_id")
    .eq("id", id)
    .single();
  if (!existing || existing.admin_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const { attendees, ...drill } = body as { attendees?: AttendeeInput[] } & Record<string, unknown>;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    "drill_date", "scenario_id", "drill_type", "location", "supervisor_name",
    "summary", "issues_found", "improvement_actions", "result_status",
    "photo_urls", "approved_by", "approved_at",
  ];
  for (const f of fields) if (f in drill) patch[f] = drill[f] === "" ? null : drill[f];

  // 참석자가 전달되면 전체 교체 + 참석자 수 재계산
  if (Array.isArray(attendees)) {
    const attendeeList = attendees.filter((a) => a.employee_name?.trim());
    await admin.from("emergency_drill_attendees").delete().eq("drill_id", id);
    if (attendeeList.length > 0) {
      await admin.from("emergency_drill_attendees").insert(
        attendeeList.map((a) => ({
          drill_id: id,
          employee_id: a.employee_id || null,
          employee_name: a.employee_name.trim(),
          attended: a.attended ?? true,
          note: a.note?.trim() || null,
        }))
      );
    }
    patch.participant_count = attendeeList.length;
  }

  const { error } = await admin.from("emergency_drills").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
