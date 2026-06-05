import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeTbmStatus } from "@/lib/tbm";

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

    // 참석자 서명 + 역할별 전자확인 상태를 종합해 TBM 상태 재계산
    // (참석자 전원 서명 시 검토중/완료로 자동 전이)
    const { data: allAttendees } = await admin
      .from("tbm_attendees")
      .select("attendance_status")
      .eq("tbm_record_id", attendee.tbm_record_id);

    const allDone = allAttendees?.every(
      (a) =>
        a.attendance_status === "서명완료" || a.attendance_status === "불참"
    );

    await recomputeTbmStatus(admin, attendee.tbm_record_id);

    return NextResponse.json({ ok: true, allSigned: allDone });
  } catch (err) {
    console.error("[tbm/sign] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
