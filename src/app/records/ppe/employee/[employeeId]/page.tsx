export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { maskPhone } from "@/lib/ppe";
import type { Employee, PpeIssuanceWithRelations } from "@/types";

export default async function PpeEmployeeCardPrintPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("admin_id", user!.id)
    .single();

  if (!employee) notFound();

  const { data: issuances } = await supabase
    .from("ppe_issuances")
    .select("*, ppe_items(id,item_name,category,model_name,certification_number)")
    .eq("employee_id", employeeId)
    .eq("admin_id", user!.id)
    .order("issued_at", { ascending: false });

  const emp = employee as Employee;
  const list = (issuances ?? []) as PpeIssuanceWithRelations[];
  const today = new Date().toLocaleDateString("ko-KR");

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* 화면 전용 상단 바 */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-4xl mx-auto mb-6">
        <Link href={`/ppe/employees/${emp.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← 직원 보호구 현황
        </Link>
        <PrintButton />
      </div>

      {/* 문서 본문 */}
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">
        {/* 문서 헤더 */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">개인별 보호장구 지급 카드</h1>
          <p className="text-xs text-gray-500 mt-1">출력일: {today}</p>
        </div>

        {/* 직원 정보 */}
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">성명</td>
              <td className="border border-gray-300 px-3 py-2">{emp.name}</td>
              <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">부서/소속</td>
              <td className="border border-gray-300 px-3 py-2">{emp.department || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">연락처</td>
              <td className="border border-gray-300 px-3 py-2">{maskPhone(emp.phone)}</td>
              <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">총 지급 건수</td>
              <td className="border border-gray-300 px-3 py-2">{list.length}건</td>
            </tr>
          </tbody>
        </table>

        {/* 지급 내역 표 */}
        <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 mb-0">보호구 지급 내역</h2>
        <table className="w-full border-collapse text-xs mb-6">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 w-8">No</th>
              <th className="border border-gray-300 px-2 py-2">품목명</th>
              <th className="border border-gray-300 px-2 py-2">모델명</th>
              <th className="border border-gray-300 px-2 py-2">안전인증번호</th>
              <th className="border border-gray-300 px-2 py-2 w-20">지급일</th>
              <th className="border border-gray-300 px-2 py-2 w-10">수량</th>
              <th className="border border-gray-300 px-2 py-2 w-20">교체예정</th>
              <th className="border border-gray-300 px-2 py-2 w-16">상태</th>
              <th className="border border-gray-300 px-2 py-2 w-20">반납일</th>
              <th className="border border-gray-300 px-2 py-2">비고</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-gray-300 px-2 py-6 text-center text-gray-400">
                  지급 내역이 없습니다.
                </td>
              </tr>
            ) : (
              list.map((i, idx) => (
                <tr key={i.id}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{i.ppe_items?.item_name ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{i.ppe_items?.model_name ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{i.ppe_items?.certification_number ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i.issued_at}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i.quantity}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i.expected_replacement_date ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i.status}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{i.returned_at ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-1.5">{i.note ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 서명란 (우선 수기 서명 빈칸) */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {["지급 담당자", "수령자", "확인자"].map((role) => (
            <div key={role} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{role}</p>
              <div className="border border-gray-300 h-20 flex items-end justify-center pb-1 rounded">
                <span className="text-[10px] text-gray-300">(서명 또는 날인)</span>
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-300 mt-8 pt-3 flex justify-between text-xs text-gray-500">
          <span>주식회사 원엔지니어링</span>
          <span>출력일시: {new Date().toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </div>
  );
}
