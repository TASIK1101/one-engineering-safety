export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { maskPhone } from "@/lib/ppe";
import type { PpeIssuanceWithRelations, PpeIssueHistory } from "@/types";

export default async function PpeIssuePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: issuance } = await supabase
    .from("ppe_issuances")
    .select(
      "*, employees(id,name,department,phone), ppe_items(id,item_name,category,model_name,certification_number,certification_agency)"
    )
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!issuance) notFound();

  const { data: history } = await supabase
    .from("ppe_issue_history")
    .select("*")
    .eq("issuance_id", id)
    .order("action_date", { ascending: true });

  const iss = issuance as PpeIssuanceWithRelations;
  const hist = (history ?? []) as PpeIssueHistory[];
  const today = new Date().toLocaleDateString("ko-KR");

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-3xl mx-auto mb-6">
        <Link
          href={iss.employee_id ? `/ppe/employees/${iss.employee_id}` : "/ppe"}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 직원 보호구 현황
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">보호구 지급 기록</h1>
          <p className="text-xs text-gray-500 mt-1">출력일: {today}</p>
        </div>

        {/* 수령자 + 품목 정보 */}
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">수령자</td>
              <td className="border border-gray-300 px-3 py-2">{iss.employees?.name ?? "-"}</td>
              <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">부서/소속</td>
              <td className="border border-gray-300 px-3 py-2">{iss.employees?.department ?? "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">연락처</td>
              <td className="border border-gray-300 px-3 py-2">{maskPhone(iss.employees?.phone)}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">상태</td>
              <td className="border border-gray-300 px-3 py-2">{iss.status}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">품목명</td>
              <td className="border border-gray-300 px-3 py-2">{iss.ppe_items?.item_name ?? "-"}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">카테고리</td>
              <td className="border border-gray-300 px-3 py-2">{iss.ppe_items?.category ?? "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">모델명</td>
              <td className="border border-gray-300 px-3 py-2">{iss.ppe_items?.model_name ?? "-"}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">안전인증번호</td>
              <td className="border border-gray-300 px-3 py-2">{iss.ppe_items?.certification_number ?? "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">지급일</td>
              <td className="border border-gray-300 px-3 py-2">{iss.issued_at}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">수량</td>
              <td className="border border-gray-300 px-3 py-2">{iss.quantity}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">교체예정일</td>
              <td className="border border-gray-300 px-3 py-2">{iss.expected_replacement_date ?? "-"}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">반납일</td>
              <td className="border border-gray-300 px-3 py-2">{iss.returned_at ?? "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">지급 사유</td>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>{iss.issue_reason ?? "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">비고</td>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>{iss.note ?? "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* 처리 이력 */}
        <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 mb-0">처리 이력</h2>
        <table className="w-full border-collapse text-xs mb-8">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 w-32">일시</th>
              <th className="border border-gray-300 px-2 py-2 w-20">처리</th>
              <th className="border border-gray-300 px-2 py-2 w-24">담당자</th>
              <th className="border border-gray-300 px-2 py-2">비고</th>
            </tr>
          </thead>
          <tbody>
            {hist.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-2 py-4 text-center text-gray-400">이력이 없습니다.</td>
              </tr>
            ) : (
              hist.map((h) => (
                <tr key={h.id}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{new Date(h.action_date).toLocaleString("ko-KR")}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{h.action_type}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{h.actor_name ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{h.note ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 서명란 */}
        <div className="grid grid-cols-3 gap-4">
          {["지급 담당자", "수령자", "확인자"].map((role) => (
            <div key={role} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{role}</p>
              <div className="border border-gray-300 h-20 flex items-end justify-center pb-1 rounded">
                <span className="text-[10px] text-gray-300">(서명 또는 날인)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 mt-8 pt-3 flex justify-between text-xs text-gray-500">
          <span>주식회사 원엔지니어링</span>
          <span>출력일시: {new Date().toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </div>
  );
}
