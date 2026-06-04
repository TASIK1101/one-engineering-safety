export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ppeStatusStyle, isReplacementDue } from "@/lib/ppe";
import type { PpeItem, PpeIssuanceWithRelations } from "@/types";

export default async function PpeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items, error: itemsErr }, { data: issuances, error: issErr }] =
    await Promise.all([
      supabase
        .from("ppe_items")
        .select("*")
        .eq("admin_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ppe_issuances")
        .select(
          "*, employees(id,name,department,phone), ppe_items(id,item_name,category,model_name,certification_number)"
        )
        .eq("admin_id", user!.id)
        .order("issued_at", { ascending: false })
        .limit(300),
    ]);

  if (itemsErr || issErr) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-red-500">{itemsErr?.message || issErr?.message}</p>
      </div>
    );
  }

  const itemList = (items ?? []) as PpeItem[];
  const issList = (issuances ?? []) as PpeIssuanceWithRelations[];

  const activeItems = itemList.filter((i) => i.active);
  const issuing = issList.filter((i) => i.status === "지급중");
  const recent = issList.slice(0, 8);
  const replacementDue = issuing.filter((i) =>
    isReplacementDue(i.expected_replacement_date)
  );
  const notReturned = issuing; // 지급중 = 아직 미반납

  // 직원별 현재 지급 수량 집계
  const byEmployee = new Map<string, { name: string; dept: string; count: number }>();
  for (const i of issuing) {
    const key = i.employee_id;
    const name = i.employees?.name ?? "(이름 없음)";
    const dept = i.employees?.department ?? "-";
    const cur = byEmployee.get(key) ?? { name, dept, count: 0 };
    cur.count += 1;
    byEmployee.set(key, cur);
  }
  const employeeSummary = Array.from(byEmployee.entries()).sort(
    (a, b) => b[1].count - a[1].count
  );

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보호구 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            보호구 품목·지급·교체 현황을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ppe/items">
            <Button variant="secondary" className="text-sm px-4 py-2.5">품목 관리</Button>
          </Link>
          <Link href="/ppe/issue">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-5 py-2.5">+ 보호구 지급</Button>
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="등록 품목" value={activeItems.length} unit="종" color="border-l-blue-500 text-blue-700" />
        <SummaryCard label="지급중" value={issuing.length} unit="건" color="border-l-indigo-500 text-indigo-700" />
        <SummaryCard label="교체 예정" value={replacementDue.length} unit="건" color="border-l-amber-500 text-amber-600" />
        <SummaryCard label="미반납" value={notReturned.length} unit="건" color="border-l-rose-500 text-rose-600" />
      </div>

      {/* 보호구 품목 목록 */}
      <SectionTitle title="보호구 품목" href="/ppe/items" linkLabel="전체 품목 →" />
      {activeItems.length === 0 ? (
        <EmptyBox
          icon="🦺"
          title="등록된 보호구 품목이 없습니다"
          desc="먼저 보호구 품목을 등록한 뒤 직원에게 지급하세요."
          href="/ppe/items/new"
          btn="+ 품목 등록"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {activeItems.slice(0, 6).map((it) => (
            <Link
              key={it.id}
              href={`/ppe/items/${it.id}`}
              className="block rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {it.category}
                </span>
                {it.certification_number && (
                  <span className="text-xs text-gray-400">인증 {it.certification_number}</span>
                )}
              </div>
              <p className="font-semibold text-gray-900">{it.item_name}</p>
              {it.model_name && (
                <p className="text-sm text-gray-500 mt-0.5">모델: {it.model_name}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 교체 예정 */}
      {replacementDue.length > 0 && (
        <>
          <SectionTitle title="⏰ 교체 예정 (30일 이내)" />
          <div className="rounded-xl bg-white border border-amber-200 shadow-sm overflow-hidden mb-8">
            {replacementDue.slice(0, 8).map((i) => (
              <Link
                key={i.id}
                href={`/ppe/employees/${i.employee_id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-amber-50 last:border-0 hover:bg-amber-50/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {i.employees?.name} · {i.ppe_items?.item_name}
                  </p>
                  <p className="text-xs text-gray-500">{i.employees?.department ?? "-"}</p>
                </div>
                <span className="text-xs font-medium text-amber-700 shrink-0 ml-3">
                  ~{i.expected_replacement_date}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* 최근 지급 내역 */}
      <SectionTitle title="최근 지급 내역" />
      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 mb-8">아직 지급 내역이 없습니다.</p>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-8">
          {recent.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {i.employees?.name ?? "-"} · {i.ppe_items?.item_name ?? "-"}
                </p>
                <p className="text-xs text-gray-400">
                  {i.issued_at} · 수량 {i.quantity}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ml-3 ${ppeStatusStyle(i.status)}`}>
                {i.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 직원별 현재 지급 현황 */}
      <SectionTitle title="직원별 현재 보유 현황" />
      {employeeSummary.length === 0 ? (
        <p className="text-sm text-gray-400">현재 지급중인 보호구가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {employeeSummary.map(([empId, info]) => (
            <Link
              key={empId}
              href={`/ppe/employees/${empId}`}
              className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:border-blue-300 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">{info.name}</p>
                <p className="text-xs text-gray-400">{info.dept}</p>
              </div>
              <span className="text-sm font-bold text-blue-600">{info.count}점 보유</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const [border, text] = color.split(" ");
  return (
    <div className={`rounded-xl bg-white border border-gray-200 border-l-4 ${border} p-4 shadow-sm`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-xs text-blue-600 hover:underline">{linkLabel}</Link>
      )}
    </div>
  );
}

function EmptyBox({ icon, title, desc, href, btn }: { icon: string; title: string; desc: string; href: string; btn: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-12 text-center mb-8">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-5">{desc}</p>
      <Link href={href}>
        <Button className="bg-blue-600 hover:bg-blue-700">{btn}</Button>
      </Link>
    </div>
  );
}
