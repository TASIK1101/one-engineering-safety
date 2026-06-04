import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("emergency_contacts")
    .select("*")
    .eq("admin_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.contact_type?.trim() || !body.organization_name?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "required_fields_missing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("emergency_contacts")
    .insert({
      admin_id: user.id,
      contact_type: body.contact_type.trim(),
      organization_name: body.organization_name.trim(),
      contact_name: body.contact_name?.trim() || null,
      phone: body.phone.trim(),
      secondary_phone: body.secondary_phone?.trim() || null,
      description: body.description?.trim() || null,
      display_order: Number(body.display_order) || 0,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
