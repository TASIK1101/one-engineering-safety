import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPermitApprover } from "@/lib/work-permit";

export async function POST(req: NextRequest) {
  try {
    const { approvalToken, name, phoneLast4 } = (await req.json()) as {
      approvalToken: string;
      name: string;
      phoneLast4: string;
    };

    if (!approvalToken || !name?.trim() || !/^\d{4}$/.test(phoneLast4 ?? "")) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await verifyPermitApprover(
      admin,
      approvalToken,
      name,
      phoneLast4
    );

    if (!result.ok) {
      const status =
        result.reason === "invalid_token" || result.reason === "no_employee_assigned"
          ? 404
          : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    if (result.alreadyDone) {
      return NextResponse.json({ error: "already_done" }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      approverName: result.approverName,
      approverRole: result.approverRole,
    });
  } catch (err) {
    console.error("[work-permits/approval/verify] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
