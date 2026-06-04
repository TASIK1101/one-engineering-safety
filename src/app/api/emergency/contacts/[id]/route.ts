import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function authAndOwn(id: string) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401 };
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("emergency_contacts")
    .select("admin_id")
    .eq("id", id)
    .single();
  if (!existing || existing.admin_id !== user.id) {
    return { error: "not_found" as const, status: 404 };
  }
  return { user, admin };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authAndOwn(id);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = ["contact_type", "organization_name", "contact_name", "phone", "secondary_phone", "description", "display_order", "active"];
  for (const f of fields) if (f in body) patch[f] = body[f];

  const { error } = await ctx.admin.from("emergency_contacts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authAndOwn(id);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  // 비활성화(soft delete)로 처리
  const { error } = await ctx.admin
    .from("emergency_contacts")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
