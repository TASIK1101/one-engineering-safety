export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import LogoMark from "@/components/ui/LogoMark";
import WorkPermitVerifyForm from "@/components/work-permit/WorkPermitVerifyForm";
import type { WorkPermit } from "@/types";

export default async function WorkPermitPublicSignPage({
  params,
}: {
  params: Promise<{ permitToken: string }>;
}) {
  const { permitToken } = await params;
  const admin = createAdminClient();

  const { data: permit } = await admin
    .from("work_permits")
    .select("id, grade, permit_type, work_name, work_location, status")
    .eq("permit_token", permitToken)
    .single();

  // 없는 토큰 → 친절한 에러 (500이나 빈 화면 대신)
  if (!permit) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <LogoMark size={40} />
            <p className="text-sm font-bold text-gray-900">주식회사 원엔지니어링</p>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center max-w-sm w-full">
            <span className="text-4xl block mb-4">⚠️</span>
            <p className="text-base font-bold text-gray-800 mb-2">
              유효하지 않거나 만료된 서명 링크입니다
            </p>
            <p className="text-sm text-gray-500">관리자에게 문의하세요.</p>
          </div>
        </main>
      </div>
    );
  }

  const p = permit as Pick<
    WorkPermit,
    "id" | "grade" | "permit_type" | "work_name" | "work_location" | "status"
  >;

  const isClosed =
    p.status === "승인완료" || p.status === "작업중지" || p.status === "반려";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="text-[11px] text-gray-400 font-medium">
              주식회사 원엔지니어링 · 작업허가서 서명
            </p>
            <p className="text-sm font-bold text-gray-900">
              {p.grade}급 — {p.permit_type}
              {p.work_name ? ` (${p.work_name})` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {isClosed ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl mb-4 block">
                {p.status === "승인완료" ? "✅" : p.status === "작업중지" ? "🚫" : "❌"}
              </span>
              <p className="text-base font-bold text-gray-800 mb-1">
                {p.status === "작업중지" ? "작업중지된 허가서입니다" : "서명이 마감되었습니다"}
              </p>
              <p className="text-sm text-gray-500">관리자에게 문의하세요.</p>
            </div>
          ) : (
            <WorkPermitVerifyForm permitToken={permitToken} />
          )}

          <p className="text-xs text-gray-300 text-center mt-8">
            주식회사 원엔지니어링 · 작업허가서 전자서명 시스템
          </p>
        </div>
      </main>
    </div>
  );
}
