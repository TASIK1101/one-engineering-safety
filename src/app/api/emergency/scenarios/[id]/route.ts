import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("emergency_scenarios")
    .select("admin_id")
    .eq("id", id)
    .single();
  if (!existing || existing.admin_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    "scenario_type", "title", "overview",
    "initial_response", "evacuation_actions", "rescue_actions",
    "hazard_removal_actions", "secondary_damage_prevention",
    "reporting_actions", "role_assignments", "active",
  ];
  for (const f of fields) if (f in body) patch[f] = body[f];

  const { error } = await admin.from("emergency_scenarios").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
