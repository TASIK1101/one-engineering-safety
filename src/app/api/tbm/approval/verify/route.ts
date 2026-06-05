import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTbmApprover } from "@/lib/tbm";

export async function POST(req: NextRequest) {
  try {
    const { approvalToken, name, phoneLast4 } = (await req.json()) as {
      approvalToken: string;
      name: string;
      phoneLast4: string;
    };

    const admin = createAdminClient();
    const result = await verifyTbmApprover(admin, approvalToken, name, phoneLast4);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (result.approval.approval_status === "승인") {
      return NextResponse.json({ error: "already_approved" }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tbm/approval/verify]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
