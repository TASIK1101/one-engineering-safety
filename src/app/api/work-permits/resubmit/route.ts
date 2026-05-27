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

    const body = await req.json();
    const {
      permitId,
      work_name,
      work_location,
      work_period_start,
      work_period_end,
      worker_count,
      supervisor_name,
      emergency_contact,
      items,
    } = body as {
      permitId: string;
      work_name?: string;
      work_location?: string;
      work_period_start?: string | null;
      work_period_end?: string | null;
      worker_count?: number | null;
      supervisor_name?: string;
      emergency_contact?: string;
      items?: { id: string; apply_status: "신청" | "해당없음" }[];
    };

    if (!permitId) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: permit } = await admin
      .from("work_permits")
      .select("id, status, admin_id")
      .eq("id", permitId)
      .single();

    if (!permit || permit.admin_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (permit.status !== "반려") {
      return NextResponse.json(
        { error: "반려 상태인 허가서만 수정 재제출할 수 있습니다." },
        { status: 400 }
      );
    }

    const { error: pErr } = await admin
      .from("work_permits")
      .update({
        work_name: work_name ?? null,
        work_location: work_location ?? null,
        work_period_start: work_period_start ?? null,
        work_period_end: work_period_end ?? null,
        worker_count: worker_count ?? null,
        supervisor_name: supervisor_name ?? null,
        emergency_contact: emergency_contact ?? null,
        status: "검토중",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", permitId);

    if (pErr) {
      console.error("[resubmit] permit update:", pErr);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    if (items && items.length > 0) {
      for (const item of items) {
        await admin
          .from("work_permit_items")
          .update({
            apply_status: item.apply_status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("permit_id", permitId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resubmit] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
