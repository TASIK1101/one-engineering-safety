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

    const { permitId, oxygen, combustible_gas, carbon_monoxide, measured_by, measured_at } =
      (await req.json()) as {
        permitId: string;
        oxygen?: number;
        combustible_gas?: number;
        carbon_monoxide?: number;
        measured_by?: string;
        measured_at?: string;
      };

    if (!permitId) {
      return NextResponse.json({ error: "permitId required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 관리자 소유 확인
    const { data: permit } = await admin
      .from("work_permits")
      .select("id")
      .eq("id", permitId)
      .eq("admin_id", user.id)
      .single();

    if (!permit) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { error } = await admin.from("work_permit_gas_measurements").insert({
      permit_id: permitId,
      oxygen: oxygen ?? null,
      combustible_gas: combustible_gas ?? null,
      carbon_monoxide: carbon_monoxide ?? null,
      measured_by: measured_by || null,
      measured_at: measured_at || new Date().toISOString(),
    });

    if (error) {
      console.error("[work-permits/add-gas-measurement]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/add-gas-measurement] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
