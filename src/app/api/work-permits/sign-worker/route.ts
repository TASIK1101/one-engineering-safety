import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputePermitStatus } from "@/lib/work-permit";

export async function POST(req: NextRequest) {
  try {
    const { workerId, signatureData } = (await req.json()) as {
      workerId: string;
      signatureData: string;
    };

    if (!workerId || !signatureData) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 중복 서명 방지
    const { data: worker } = await admin
      .from("work_permit_workers")
      .select("id, permit_id, signed_at")
      .eq("id", workerId)
      .single();

    if (!worker) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (worker.signed_at) {
      return NextResponse.json({ error: "already_signed" }, { status: 409 });
    }

    const { error } = await admin
      .from("work_permit_workers")
      .update({
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (error) {
      console.error("[work-permits/sign-worker]", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    // 전체 서명 완료 시 자동으로 검토중 전환
    await recomputePermitStatus(admin, worker.permit_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[work-permits/sign-worker] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
