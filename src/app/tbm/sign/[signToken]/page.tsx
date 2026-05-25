export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LogoMark from "@/components/ui/LogoMark";
import TBMPhoneVerifyForm from "@/components/tbm/TBMPhoneVerifyForm";
import type { TbmRecord } from "@/types";

export default async function TbmPublicSignListPage({
  params,
}: {
  params: Promise<{ signToken: string }>;
}) {
  const { signToken } = await params;
  const supabase = await createClient();

  // signToken 유효성 확인 (참석자 정보는 서버에서 노출하지 않음)
  const { data: record } = await supabase
    .from("tbm_records")
    .select("id, date, work_type, status")
    .eq("sign_token", signToken)
    .single();

  if (!record) notFound();

  const tbm = record as Pick<TbmRecord, "id" | "date" | "work_type" | "status">;
  const isCompleted = tbm.status === "완료" || tbm.status === "검토중";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              주식회사 원엔지니어링 · TBM 위험성평가 서명
            </p>
            <p className="text-sm font-bold text-gray-900">
              {tbm.date} {tbm.work_type} TBM
            </p>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {isCompleted ? (
            /* 서명 마감 안내 */
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">✅</span>
              <p className="text-base font-bold text-gray-800 mb-1">
                서명이 마감되었습니다
              </p>
              <p className="text-sm text-gray-500">
                이미 서명이 완료된 TBM입니다.
                <br />
                관리자에게 문의하세요.
              </p>
            </div>
          ) : (
            /* 본인 확인 폼 — 이름 + 전화번호 뒷자리만 */
            <TBMPhoneVerifyForm signToken={signToken} />
          )}

          <p className="text-xs text-gray-300 text-center mt-8">
            주식회사 원엔지니어링 · TBM 위험성평가 전자서명 시스템
          </p>
        </div>
      </main>
    </div>
  );
}
