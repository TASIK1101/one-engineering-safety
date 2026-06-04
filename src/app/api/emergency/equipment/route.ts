import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.equipment_name?.trim() || !body.category?.trim() || !body.location?.trim()) {
    return NextResponse.json({ error: "required_fields_missing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("emergency_equipment")
    .insert({
      admin_id: user.id,
      equipment_name: body.equipment_name.trim(),
      category: body.category.trim(),
      location: body.location.trim(),
      quantity: Number(body.quantity) || 1,
      status: body.status || "정상",
      last_inspected_at: body.last_inspected_at || null,
      next_inspection_date: body.next_inspection_date || null,
      inspector_name: body.inspector_name?.trim() || null,
      note: body.note?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
