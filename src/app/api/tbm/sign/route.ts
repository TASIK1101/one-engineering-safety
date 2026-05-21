import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { attendeeId, signatureData } = (await req.json()) as {
      attendeeId: string;
      signatureData: string;
    };

    if (!attendeeId || !signatureData) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: attendee, error: fetchErr } = await admin
      .from("tbm_attendees")
      .select("id, attendance_status, tbm_record_id")
      .eq("id", attendeeId)
      .single();

    if (fetchErr || !attendee) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (attendee.attendance_status === "서명완료") {
      return NextResponse.json({ error: "already_signed" }, { status: 409 });
    }

    const { error: updateErr } = await admin
      .from("tbm_attendees")
      .update({
        attendance_status: "서명완료",
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .eq("id", attendeeId);

    if (updateErr) {
      console.error("[tbm/sign]", updateErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // 모든 참석자가 서명하면 상태를 '검토중'으로 변경
    const { data: allAttendees } = await admin
      .from("tbm_attendees")
      .select("attendance_status")
      .eq("tbm_record_id", attendee.tbm_record_id);

    const allDone = allAttendees?.every(
      (a) =>
        a.attendance_status === "서명완료" || a.attendance_status === "불참"
    );

    if (allDone) {
      await admin
        .from("tbm_records")
        .update({
          status: "검토중",
          updated_at: new Date().toISOString(),
        })
        .eq("id", attendee.tbm_record_id);
    }

    return NextResponse.json({ ok: true, allSigned: allDone });
  } catch (err) {
    console.error("[tbm/sign] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
