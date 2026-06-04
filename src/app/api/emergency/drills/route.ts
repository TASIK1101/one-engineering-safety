import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AttendeeInput = { employee_id?: string | null; employee_name: string; attended?: boolean; note?: string | null };

export async function POST(req: NextRequest) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { attendees, ...drill } = body as { attendees?: AttendeeInput[] } & Record<string, unknown>;

  if (!drill.drill_date || !drill.drill_type || !drill.location) {
    return NextResponse.json({ error: "required_fields_missing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const attendeeList = Array.isArray(attendees) ? attendees.filter((a) => a.employee_name?.trim()) : [];
  const participantCount = attendeeList.length || Number(drill.participant_count) || 0;

  const { data: created, error } = await admin
    .from("emergency_drills")
    .insert({
      admin_id: user.id,
      created_by: user.id,
      drill_date: drill.drill_date,
      scenario_id: drill.scenario_id || null,
      drill_type: drill.drill_type,
      location: drill.location,
      supervisor_name: (drill.supervisor_name as string)?.trim() || null,
      participant_count: participantCount,
      summary: (drill.summary as string)?.trim() || null,
      issues_found: (drill.issues_found as string)?.trim() || null,
      improvement_actions: (drill.improvement_actions as string)?.trim() || null,
      result_status: drill.result_status || "작성중",
      photo_urls: Array.isArray(drill.photo_urls) ? drill.photo_urls : [],
      approved_by: (drill.approved_by as string)?.trim() || null,
      approved_at: drill.approved_at || null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (attendeeList.length > 0) {
    const { error: attErr } = await admin.from("emergency_drill_attendees").insert(
      attendeeList.map((a) => ({
        drill_id: created.id,
        employee_id: a.employee_id || null,
        employee_name: a.employee_name.trim(),
        attended: a.attended ?? true,
        note: a.note?.trim() || null,
      }))
    );
    if (attErr) {
      console.error("[emergency/drills] attendees insert:", attErr);
    }
  }

  return NextResponse.json({ id: created.id });
}
