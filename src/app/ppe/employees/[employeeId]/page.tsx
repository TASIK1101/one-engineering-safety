export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PpeIssuanceActions from "@/components/ppe/PpeIssuanceActions";
import { ppeStatusStyle, maskPhone } from "@/lib/ppe";
import type { Employee, PpeIssuanceWithRelations } from "@/types";

export default async function PpeEmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee, error: empErr } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("admin_id", user!.id)
    .single();

  if (empErr && empErr.code !== "PGRST116") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-semibold mb-1">데이터를 불러오지 못했습니다</p>
        <p className="text-sm text-red-500">{empErr.message}</p>
      </div>
    );
  }
  if (!employee) notFound();

  const { data: issuances } = await supabase
    .from("ppe_issuances")
    .select("*, ppe_items(id,item_name,category,model_name,certification_number)")
    .eq("employee_id", employeeId)
    .eq("admin_id", user!.id)
    .order("issued_at", { ascending: false });

  const emp = employee as Employee;
  const issList = (issuances ?? []) as PpeIssuanceWithRelations[];

  const current = issList.filter((i) => i.status === "지급중");
  const history = issList.filter((i) => i.status !== "지급중");

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ppe" className="text-gray-400 hover:text-gray-600 text-sm">← 보호구 관리</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">직원별 보호구 현황</h1>
      </div>

      {/* 직원 정보 */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{emp.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {emp.department || "부서 미지정"} · {maskPhone(emp.phone)}
            </p>
            <p className="text-sm text-blue-600 font-medium mt-2">
              현재 보유 {current.length}점
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link href={`/ppe/issue?employee=${emp.id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm w-full">+ 지급</Button>
            </Link>
            <Link href={`/records/ppe/employee/${emp.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="text-sm w-full">🖨️ 지급카드</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 현재 보유 */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">현재 보유 보호구</h3>
      {current.length === 0 ? (
        <p className="text-sm text-gray-400 mb-8">현재 지급중인 보호구가 없습니다.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {current.map((i) => (
            <div key={i.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {i.ppe_items?.category ?? "-"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ppeStatusStyle(i.status)}`}>
                      {i.status}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{i.ppe_items?.item_name ?? "-"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    지급일 {i.issued_at} · 수량 {i.quantity}
                    {i.expected_replacement_date ? ` · 교체예정 ${i.expected_replacement_date}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <Link href={`/records/ppe/issue/${i.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  지급 기록 인쇄 →
                </Link>
                <PpeIssuanceActions issuanceId={i.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 과거 이력 (반납/교체/분실/폐기) */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">과거 이력</h3>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400">과거 이력이 없습니다.</p>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {history.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{i.ppe_items?.item_name ?? "-"}</p>
                <p className="text-xs text-gray-400">
                  지급 {i.issued_at}
                  {i.returned_at ? ` · 반납 ${i.returned_at}` : ""}
                  {i.replaced_at ? ` · 교체 ${i.replaced_at}` : ""}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ml-3 ${ppeStatusStyle(i.status)}`}>
                {i.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
