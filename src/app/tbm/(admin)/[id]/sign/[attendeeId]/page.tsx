export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LogoMark from "@/components/ui/LogoMark";
import TBMSignForm from "@/components/tbm/TBMSignForm";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmSignPage({
  params,
}: {
  params: Promise<{ id: string; attendeeId: string }>;
}) {
  const { id, attendeeId } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("id", id)
    .single();

  if (!record) notFound();

  const { data: attendee } = await supabase
    .from("tbm_attendees")
    .select("*")
    .eq("id", attendeeId)
    .eq("tbm_record_id", id)
    .single();

  if (!attendee) notFound();

  const tbm = record as TbmRecord;
  const att = attendee as TbmAttendee;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <p className="text-[11px] text-gray-400">
              주식회사 원엔지니어링 · TBM 서명
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {tbm.date} {tbm.work_type} TBM
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 pb-16">
        <TBMSignForm tbm={tbm} attendee={att} />
      </div>
    </div>
  );
}
