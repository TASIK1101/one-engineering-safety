export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PpeItemCard from "@/components/ppe/PpeItemCard";
import { ppeStatusStyle } from "@/lib/ppe";
import type { PpeItem, PpeIssuanceWithRelations } from "@/types";

export default async function PpeItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item, error: itemErr } = await supabase
    .from("ppe_items")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (itemErr && itemErr.code !== "PGRST116") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-red-500">{itemErr.message}</p>
      </div>
    );
  }
  if (!item) notFound();

  const { data: issuances } = await supabase
    .from("ppe_issuances")
    .select("*, employees(id,name,department,phone)")
    .eq("ppe_item_id", id)
    .eq("admin_id", user!.id)
    .order("issued_at", { ascending: false });

  const issList = (issuances ?? []) as PpeIssuanceWithRelations[];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ppe/items" className="text-gray-400 hover:text-gray-600 text-sm">← 품목 목록</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">품목 상세</h1>
      </div>

      <PpeItemCard item={item as PpeItem} />

      {/* 이 품목 지급 내역 */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">
        지급 내역 ({issList.length}건)
      </h2>
      {issList.length === 0 ? (
        <p className="text-sm text-gray-400">이 품목의 지급 내역이 없습니다.</p>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {issList.map((i) => (
            <Link
              key={i.id}
              href={`/ppe/employees/${i.employee_id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {i.employees?.name ?? "-"}
                  <span className="ml-2 text-xs text-gray-400">{i.employees?.department ?? ""}</span>
                </p>
                <p className="text-xs text-gray-400">지급일 {i.issued_at} · 수량 {i.quantity}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ml-3 ${ppeStatusStyle(i.status)}`}>
                {i.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
