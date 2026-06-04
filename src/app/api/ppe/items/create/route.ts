import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  item_name: string;
  category: string;
  model_name?: string;
  manufacturer?: string;
  certification_number?: string;
  certification_date?: string;
  certification_agency?: string;
  certificate_file_url?: string;
  replacement_cycle_months?: number | null;
  description?: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as Body;

    if (!body.item_name?.trim() || !body.category?.trim()) {
      return NextResponse.json({ error: "item_name_and_category_required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: item, error: itemErr } = await admin
      .from("ppe_items")
      .insert({
        admin_id: user.id,
        item_name: body.item_name.trim(),
        category: body.category.trim(),
        model_name: body.model_name?.trim() || null,
        manufacturer: body.manufacturer?.trim() || null,
        certification_number: body.certification_number?.trim() || null,
        certification_date: body.certification_date || null,
        certification_agency: body.certification_agency?.trim() || null,
        certificate_file_url: body.certificate_file_url?.trim() || null,
        replacement_cycle_months: body.replacement_cycle_months ?? null,
        description: body.description?.trim() || null,
        active: true,
      })
      .select("id")
      .single();

    if (itemErr || !item) {
      console.error("[ppe/items/create] insert:", itemErr);
      return NextResponse.json({ error: "insert_failed", detail: itemErr?.message }, { status: 500 });
    }

    // 인증서 파일이 첨부된 경우 ppe_certificates 에도 기록
    if (body.certificate_file_url?.trim()) {
      const { error: certErr } = await admin.from("ppe_certificates").insert({
        ppe_item_id: item.id,
        certificate_name: `${body.item_name.trim()} 안전인증서`,
        certification_number: body.certification_number?.trim() || null,
        certification_date: body.certification_date || null,
        certification_agency: body.certification_agency?.trim() || null,
        model_name: body.model_name?.trim() || null,
        manufacturer: body.manufacturer?.trim() || null,
        file_url: body.certificate_file_url.trim(),
      });
      if (certErr) {
        console.error("[ppe/items/create] certificate insert:", certErr);
        // 인증서 기록 실패는 품목 생성 자체를 막지 않되 경고 반환
        return NextResponse.json({ id: item.id, warning: "certificate_record_failed" });
      }
    }

    return NextResponse.json({ id: item.id });
  } catch (err) {
    console.error("[ppe/items/create] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
