export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { stopWorkStatusStyle, STOP_WORK_STATUSES } from "@/lib/emergency";
import type { StopWorkRecord } from "@/types";

export default async function StopWorkListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date_from?: string; date_to?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin
    .from("stop_work_records")
    .select("*")
    .eq("admin_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(300);

  let list = (data ?? []) as StopWorkRecord[];
  if (sp.status) list = list.filter((r) => r.status === sp.status);
  if (sp.date_from) list = list.filter((r) => r.occurred_at >= sp.date_from!);
  if (sp.date_to) list = list.filter((r) => r.occurred_at.slice(0, 10) <= sp.date_to!);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    list = list.filter(
      (r) =>
        r.worksite_location.toLowerCase().includes(q) ||
        r.stop_reason.toLowerCase().includes(q) ||
        r.reporter_name.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">작업중지 기록</h1>
          <p className="text-sm text-gray-500 mt-1">작업중지권 행사 및 위험요인 조치 기록을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emergency" className="text-sm text-gray-500 hover:text-gray-700">← 대시보드</Link>
          <Link href="/emergency/stop-work/new" className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">+ 작업중지 등록</Link>
        </div>
      </div>

      {/* 필터 */}
      <form className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3" action="/emergency/stop-work">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">상태</label>
          <select name="status" defaultValue={sp.status ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">전체</option>
            {STOP_WORK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">시작일</label>
          <input type="date" name="date_from" defaultValue={sp.date_from ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">검색어 (위치/사유/신고자)</label>
          <input type="text" name="q" defaultValue={sp.q ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">검색</button>
          <Link href="/emergency/stop-work" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">초기화</Link>
        </div>
      </form>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-sm">작업중지 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {list.map((r) => (
            <Link key={r.id} href={`/emergency/stop-work/${r.id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 whitespace-nowrap ${stopWorkStatusStyle(r.status)}`}>{r.status}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.stop_reason}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.worksite_location} · 신고자 {r.reporter_name} · {r.occurred_at?.slice(0, 16).replace("T", " ")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
