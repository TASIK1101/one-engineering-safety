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

    const { permitId, worker_name, entry_time, exit_time, note } = (await req.json()) as {
      permitId: string;
      worker_name: string;
      entry_time?: string | null;
      exit_time?: string | null;
      note?: string | null;
    };

    if (!permitId || !worker_name?.trim()) {
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

    const { data: log, error: logErr } = await admin
      .from("confined_space_entry_logs")
      .insert({
        permit_id: permitId,
        worker_name: worker_name.trim(),
        entry_time: entry_time || null,
        exit_time: exit_time || null,
        note: note || null,
      })
      .select("id")
      .single();

    if (logErr) {
      console.error("[entry-logs] insert:", logErr);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: log.id });
  } catch (err) {
    console.error("[entry-logs] unexpected:", err);
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

    const { logId } = (await req.json()) as { logId: string };
    if (!logId) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const admin = createAdminClient();

    const { data: log } = await admin
      .from("confined_space_entry_logs")
      .select("id, permit_id")
      .eq("id", logId)
      .single();

    if (!log) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: permit } = await admin
      .from("work_permits")
      .select("id")
      .eq("id", log.permit_id)
      .eq("admin_id", user.id)
      .single();

    if (!permit) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { error: delErr } = await admin
      .from("confined_space_entry_logs")
      .delete()
      .eq("id", logId);

    if (delErr) {
      console.error("[entry-logs] delete:", delErr);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[entry-logs] delete unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
