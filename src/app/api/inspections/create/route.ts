import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ItemInput = {
  category: string;
  item_text: string;
  location?: string;
  condition_status: "양호" | "보통" | "불량";
  issue_description?: string;
  action_note?: string;
  before_photo_url?: string;
  assigned_to?: string;
  due_date?: string;
};

type RequestBody = {
  inspection_date: string;
  inspector_name: string;
  inspection_area: string;
  worksite_id?: string;
  items: ItemInput[];
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as RequestBody;
    const { inspection_date, inspector_name, inspection_area, worksite_id, items } = body;

    if (!inspection_date || !inspector_name || !inspection_area) {
      return NextResponse.json(
        { error: "inspection_date, inspector_name, inspection_area are required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Insert safety_inspection
    const { data: inspection, error: inspectionErr } = await admin
      .from("safety_inspections")
      .insert({
        admin_id: user.id,
        inspection_date,
        inspector_name,
        inspection_area,
        worksite_id: worksite_id ?? null,
        status: "완료",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (inspectionErr || !inspection) {
      console.error("[inspections/create] inspection insert error:", inspectionErr);
      return NextResponse.json({ error: "inspection_insert_failed" }, { status: 500 });
    }

    // 2. Insert all inspection items
    const itemRows = items.map((item) => ({
      inspection_id: inspection.id,
      category: item.category,
      item_text: item.item_text,
      location: item.location ?? null,
      condition_status: item.condition_status,
      issue_description: item.issue_description ?? null,
      action_note: item.action_note ?? null,
      before_photo_url: item.before_photo_url ?? null,
      after_photo_url: null,
    }));

    const { data: insertedItems, error: itemsErr } = await admin
      .from("safety_inspection_items")
      .insert(itemRows)
      .select("id, condition_status, item_text, issue_description, before_photo_url");

    if (itemsErr || !insertedItems) {
      console.error("[inspections/create] items insert error:", itemsErr);
      // Roll back inspection
      await admin.from("safety_inspections").delete().eq("id", inspection.id);
      return NextResponse.json({ error: "items_insert_failed" }, { status: 500 });
    }

    // 3. For each '불량' item, insert corrective_action
    const badItems = insertedItems.filter((dbItem) => dbItem.condition_status === "불량");
    let correctiveActionsCreated = 0;

    if (badItems.length > 0) {
      // Match inserted DB items back to the original input to get assigned_to / due_date
      // insertedItems preserves insertion order (same order as itemRows)
      const inputByIndex = new Map<string, ItemInput>();
      insertedItems.forEach((dbItem, idx) => {
        inputByIndex.set(dbItem.id, items[idx]);
      });

      const correctiveRows = badItems.map((dbItem) => {
        const originalInput = inputByIndex.get(dbItem.id);
        return {
          admin_id: user.id,
          inspection_id: inspection.id,
          inspection_item_id: dbItem.id,
          issue_title: dbItem.item_text,
          issue_description: dbItem.issue_description ?? null,
          before_photo_url: dbItem.before_photo_url ?? null,
          assigned_to: originalInput?.assigned_to ?? null,
          due_date: originalInput?.due_date ?? null,
          status: "대기" as const,
        };
      });

      const { error: caErr } = await admin.from("corrective_actions").insert(correctiveRows);

      if (caErr) {
        console.error("[inspections/create] corrective_actions insert error:", caErr);
        // Roll back items and inspection
        await admin.from("safety_inspection_items").delete().eq("inspection_id", inspection.id);
        await admin.from("safety_inspections").delete().eq("id", inspection.id);
        return NextResponse.json({ error: "corrective_actions_insert_failed" }, { status: 500 });
      }

      correctiveActionsCreated = correctiveRows.length;
    }

    return NextResponse.json({ id: inspection.id, correctiveActionsCreated });
  } catch (err) {
    console.error("[inspections/create] unexpected:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
