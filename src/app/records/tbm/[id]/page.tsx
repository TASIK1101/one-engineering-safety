export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import TbmPrintDocument from "@/components/print/documents/TbmPrintDocument";
import type { TbmRecord, TbmAttendee, TbmApproval } from "@/types";

export default async function TbmPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const [{ data: attendees }, { data: approvalsData }] = await Promise.all([
    supabase.from("tbm_attendees").select("*").eq("tbm_record_id", id).order("created_at"),
    supabase.from("tbm_approvals").select("*").eq("tbm_record_id", id).order("created_at"),
  ]);

  const tbm = record as TbmRecord;
  const att = (attendees ?? []) as TbmAttendee[];
  const approvals = (approvalsData ?? []) as TbmApproval[];

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref="/records"
        backLabel="← 통합 기록 보관함"
        pageTitle="TBM 기록 출력"
        hasAppendix={att.length > 0}
      />
      <TbmPrintDocument tbm={tbm} attendees={att} approvals={approvals} />
    </>
  );
}
