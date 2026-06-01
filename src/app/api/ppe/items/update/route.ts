import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  id: string;
  item_name?: string;
  category?: string;
  model_name?: string;
  manufacturer?: string;
  certification_number?: string;
  certification_date?: string;
  certification_agency?: string;
  certificate_file_url?: string;
  replacement_cycle_months?: number | null;
  description?: string;
  active?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as Body;
    if (!body.id) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 소유권 확인
    const { data: existing } = await admin
      .from("ppe_items")
      .select("id, admin_id")
      .eq("id", body.id)
      .single();
    if (!existing || existing.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.item_name !== undefined) patch.item_name = body.item_name.trim();
    if (body.category !== undefined) patch.category = body.category.trim();
    if (body.model_name !== undefined) patch.model_name = body.model_name.trim() || null;
    if (body.manufacturer !== undefined) patch.manufacturer = body.manufacturer.trim() || null;
    if (body.certification_number !== undefined) patch.certification_number = body.certification_number.trim() || null;
    if (body.certification_date !== undefined) patch.certification_date = body.certification_date || null;
    if (body.certification_agency !== undefined) patch.certification_agency = body.certification_agency.trim() || null;
    if (body.certificate_file_url !== undefined) patch.certificate_file_url = body.certificate_file_url.trim() || null;
    if (body.replacement_cycle_months !== undefined) patch.replacement_cycle_months = body.replacement_cycle_months;
    if (body.description !== undefined) patch.description = body.description.trim() || null;
    if (body.active !== undefined) patch.active = body.active;

    const { error } = await admin.from("ppe_items").update(patch).eq("id", body.id);
    if (error) {
      console.error("[ppe/items/update]:", error);
      return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ppe/items/update] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
