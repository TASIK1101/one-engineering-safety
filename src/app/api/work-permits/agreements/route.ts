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

    const { permitId, company_name, contact_name, signature_data } = (await req.json()) as {
      permitId: string;
      company_name: string;
      contact_name?: string | null;
      signature_data?: string | null;
    };

    if (!permitId || !company_name?.trim()) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: permit } = await admin
      .from("work_permits")
      .select("id")
      .eq("id", permitId)
      .eq("admin_id", user.id)
      .single();

    if (!permit) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: agreement, error: agrErr } = await admin
      .from("related_company_agreements")
      .insert({
        permit_id: permitId,
        company_name: company_name.trim(),
        contact_name: contact_name?.trim() || null,
        signature_data: signature_data || null,
        signed_at: signature_data ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (agrErr) {
      console.error("[agreements] insert:", agrErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: agreement.id });
  } catch (err) {
    console.error("[agreements] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { agreementId } = (await req.json()) as { agreementId: string };
    if (!agreementId) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const admin = createAdminClient();

    const { data: agreement } = await admin
      .from("related_company_agreements")
      .select("id, permit_id")
      .eq("id", agreementId)
      .single();

    if (!agreement) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: permit } = await admin
      .from("work_permits")
      .select("id")
      .eq("id", agreement.permit_id)
      .eq("admin_id", user.id)
      .single();

    if (!permit) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { error: delErr } = await admin
      .from("related_company_agreements")
      .delete()
      .eq("id", agreementId);

    if (delErr) {
      console.error("[agreements] delete:", delErr);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[agreements] delete unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
