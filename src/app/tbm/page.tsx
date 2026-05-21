export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import TBMStatusBadge from "@/components/tbm/TBMStatusBadge";
import type { TbmRecord } from "@/types";

export default async function TbmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayRecords } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("admin_id", user!.id)
    .eq("date", today)
    .order("created_at", { ascending: false });

  const { data: pendingRecords } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("admin_id", user!.id)
    .in("status", ["서명중", "검토중"])
    .neq("date", today)
    .order("date", { ascending: false })
    .limit(5);

  const todayCompleted =
    todayRecords?.filter((r) => r.status === "완료").length ?? 0;
  const todayPending =
    todayRecords?.filter((r) => r.status !== "완료").length ?? 0;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            TBM 위험성평가 교육
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            오늘 날짜:{" "}
            {new Date(today).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        <Link href="/tbm/new">
          <Button className="bg-green-600 hover:bg-green-700">
            + 새 TBM 작성
          </Button>
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-blue-500 p-4 shadow-sm">
          <p className="text-xs text-gray-500">오늘 작성</p>
          <p className="text-3xl font-bold text-blue-600">
            {todayRecords?.length ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-amber-500 p-4 shadow-sm">
          <p className="text-xs text-gray-500">서명 대기</p>
          <p className="text-3xl font-bold text-amber-600">
            {todayPending}
            <span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-green-500 p-4 shadow-sm">
          <p className="text-xs text-gray-500">완료</p>
          <p className="text-3xl font-bold text-green-600">
            {todayCompleted}
            <span className="text-sm font-normal text-gray-400 ml-1">건</span>
          </p>
        </div>
      </div>

      {/* 오늘 TBM 목록 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          오늘 TBM
        </h2>
        {!todayRecords || todayRecords.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-gray-700 mb-1">
              오늘 작성된 TBM이 없습니다
            </p>
            <p className="text-sm text-gray-400 mb-5">
              작업 시작 전 TBM 교육을 등록하세요.
            </p>
            <Link href="/tbm/new">
              <Button className="bg-green-600 hover:bg-green-700">
                + 새 TBM 작성
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(todayRecords as TbmRecord[]).map((r) => (
              <TBMCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>

      {/* 진행 중 TBM (이전 날짜) */}
      {pendingRecords && pendingRecords.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            진행 중 TBM (이전 날짜)
          </h2>
          <div className="flex flex-col gap-3">
            {(pendingRecords as TbmRecord[]).map((r) => (
              <TBMCard key={r.id} record={r} />
            ))}
          </div>
        </section>
      )}

      {/* 기록 보관함 링크 */}
      <div className="text-center">
        <Link href="/tbm/records" className="text-sm text-blue-600 hover:underline">
          전체 TBM 기록 보관함 →
        </Link>
      </div>
    </div>
  );
}

function TBMCard({ record }: { record: TbmRecord }) {
  return (
    <Link
      href={`/tbm/${record.id}`}
      className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TBMStatusBadge status={record.status} />
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            {record.work_type}
          </span>
          <span className="text-xs text-gray-400">{record.date}</span>
        </div>
        <p className="font-semibold text-gray-900">
          {record.date} {record.work_type} TBM
          {record.process_name && (
            <span className="font-normal text-gray-500 ml-1">
              — {record.process_name}
            </span>
          )}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {[record.worksite_location, record.supervisor]
            .filter(Boolean)
            .join(" · ") || "위치/실시자 미입력"}
        </p>
      </div>
      <span className="text-blue-600 text-sm ml-4 shrink-0">상세 보기 →</span>
    </Link>
  );
}
