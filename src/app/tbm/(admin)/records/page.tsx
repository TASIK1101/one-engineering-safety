export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import TBMStatusBadge from "@/components/tbm/TBMStatusBadge";
import TBMRecordsFilter from "@/components/tbm/TBMRecordsFilter";
import type { TbmRecord } from "@/types";

export default async function TbmRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    work_type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("tbm_records")
    .select("*")
    .eq("admin_id", user!.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.work_type) query = query.eq("work_type", sp.work_type);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.date_from) query = query.gte("date", sp.date_from);
  if (sp.date_to) query = query.lte("date", sp.date_to);

  const { data: records } = await query.limit(100);

  const filtered = (records ?? []).filter((r) => {
    if (!sp.q) return true;
    const q = sp.q.toLowerCase();
    return (
      r.work_type?.toLowerCase().includes(q) ||
      r.process_name?.toLowerCase().includes(q) ||
      r.worksite_location?.toLowerCase().includes(q) ||
      r.company?.toLowerCase().includes(q) ||
      r.supervisor?.toLowerCase().includes(q)
    );
  }) as TbmRecord[];

  return (
    <div>
      <div className="mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">TBM 기록 보관함</h1>
        <p className="text-sm text-gray-500 mt-1">
          날짜, 공종, 작업장, 상태별로 TBM 기록을 조회합니다.
        </p>
      </div>

      <Suspense>
        <TBMRecordsFilter />
      </Suspense>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-14 text-center">
            <div className="text-4xl mb-4">📂</div>
            <p className="font-semibold text-gray-700">
              조회된 TBM 기록이 없습니다
            </p>
            <p className="text-sm text-gray-400 mt-1">
              검색 조건을 변경하거나 새 TBM을 작성하세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/tbm/${r.id}`}
                className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TBMStatusBadge status={r.status} />
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                      {r.work_type}
                    </span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {r.date} {r.work_type} TBM
                    {r.process_name && (
                      <span className="font-normal text-gray-500 ml-2">
                        — {r.process_name}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[r.worksite_location, r.supervisor]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </p>
                </div>
                <span className="text-blue-600 text-sm ml-4 shrink-0">
                  상세 →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
