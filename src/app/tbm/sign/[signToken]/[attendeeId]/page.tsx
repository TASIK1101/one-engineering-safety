export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import TBMSignForm from "@/components/tbm/TBMSignForm";
import type { TbmRecord, TbmAttendee } from "@/types";

export default async function TbmPublicSignPage({
  params,
}: {
  params: Promise<{ signToken: string; attendeeId: string }>;
}) {
  const { signToken, attendeeId } = await params;
  const supabase = await createClient();

  // sign_token으로 TBM 레코드 조회 (인증 불필요)
  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("sign_token", signToken)
    .single();

  if (!record) notFound();

  // 해당 TBM에 속한 참석자인지 확인
  const { data: attendee } = await supabase
    .from("tbm_attendees")
    .select("*")
    .eq("id", attendeeId)
    .eq("tbm_record_id", record.id)
    .single();

  if (!attendee) notFound();

  const tbm = record as TbmRecord;
  const att = attendee as TbmAttendee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div>
              <p className="text-[11px] text-gray-400 font-medium">
                주식회사 원엔지니어링 · TBM 서명
              </p>
              <p className="text-sm font-bold text-gray-900">
                {tbm.date} {tbm.work_type} TBM
              </p>
            </div>
          </div>
          {/* 목록으로 돌아가기 */}
          <Link
            href={`/tbm/sign/${signToken}`}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
          >
            ← 목록
          </Link>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 pb-16">
        <TBMSignForm tbm={tbm} attendee={att} />
      </div>
    </div>
  );
}
