export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { PpeItem } from "@/types";

export default async function PpeItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items, error } = await supabase
    .from("ppe_items")
    .select("*")
    .eq("admin_id", user!.id)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-red-500">{error.message}</p>
      </div>
    );
  }

  const list = (items ?? []) as PpeItem[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/ppe" className="text-sm text-gray-400 hover:text-gray-600">← 보호구 관리</Link>
      </div>
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보호구 품목</h1>
          <p className="text-sm text-gray-500 mt-1">보호구 품목 마스터를 관리합니다</p>
        </div>
        <Link href="/ppe/items/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-5 py-2.5">+ 품목 등록</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🦺</div>
          <p className="font-semibold text-gray-700 mb-1">등록된 품목이 없습니다</p>
          <p className="text-sm text-gray-400 mb-5">보호구 품목을 등록하세요.</p>
          <Link href="/ppe/items/new">
            <Button className="bg-blue-600 hover:bg-blue-700">+ 품목 등록</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {/* 데스크탑 헤더 */}
          <div className="hidden sm:grid grid-cols-[90px_1fr_120px_140px_90px_70px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>카테고리</span>
            <span>품목명 / 모델</span>
            <span>안전인증번호</span>
            <span>인증기관</span>
            <span>교체주기</span>
            <span className="text-right">상태</span>
          </div>
          <div className="divide-y divide-gray-100">
            {list.map((it) => (
              <Link
                key={it.id}
                href={`/ppe/items/${it.id}`}
                className={`grid grid-cols-1 sm:grid-cols-[90px_1fr_120px_140px_90px_70px] gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  it.active ? "" : "opacity-50"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {it.category}
                  </span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">{it.item_name}</span>
                  {it.model_name && <span className="text-xs text-gray-400">{it.model_name}</span>}
                </div>
                <div className="flex items-center text-xs text-gray-600">{it.certification_number ?? "-"}</div>
                <div className="flex items-center text-xs text-gray-500 truncate">{it.certification_agency ?? "-"}</div>
                <div className="flex items-center text-xs text-gray-500">
                  {it.replacement_cycle_months ? `${it.replacement_cycle_months}개월` : "-"}
                </div>
                <div className="flex items-center sm:justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    it.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                  }`}>
                    {it.active ? "사용" : "비활성"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
