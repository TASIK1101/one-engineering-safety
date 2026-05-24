export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { getConditionColor } from "@/lib/inspection-categories";
import type { SafetyInspection, SafetyInspectionItem, CorrectiveAction } from "@/types";

export default async function InspectionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record } = await supabase
    .from("safety_inspections")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const [{ data: rawItems }, { data: rawActions }] = await Promise.all([
    supabase
      .from("safety_inspection_items")
      .select("*")
      .eq("inspection_id", id)
      .order("category")
      .order("item_text"),
    supabase
      .from("corrective_actions")
      .select("id,issue_title,assigned_to,due_date,status")
      .eq("inspection_id", id)
      .order("created_at"),
  ]);

  const insp = record as SafetyInspection;
  const items = (rawItems ?? []) as SafetyInspectionItem[];
  const actions = (rawActions ?? []) as Pick<CorrectiveAction, "id" | "issue_title" | "assigned_to" | "due_date" | "status">[];

  // 카테고리별 그룹핑
  const categoryMap = new Map<string, SafetyInspectionItem[]>();
  for (const item of items) {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category)!.push(item);
  }
  const categories = Array.from(categoryMap.entries());

  const totalItems  = items.length;
  const 양호Count = items.filter(i => i.condition_status === "양호").length;
  const 보통Count = items.filter(i => i.condition_status === "보통").length;
  const 불량Count = items.filter(i => i.condition_status === "불량").length;

  const conditionSymbol = (status: string, target: string) =>
    status === target ? "○" : "";

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* 화면 전용 상단 바 */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-5xl mx-auto mb-6">
        <Link href="/records" className="text-sm text-gray-500 hover:text-gray-700">
          ← 통합 기록 보관함
        </Link>
        <PrintButton />
      </div>

      {/* 문서 본문 */}
      <div className="max-w-5xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">

        {/* 문서 헤더 */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">안전보건관리책임자 안전점검 일지</h1>
          <p className="text-xs text-gray-500 mt-1">문서번호: INS-{insp.inspection_date}</p>
        </div>

        {/* 점검 기본정보 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">점검 기본정보</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">점검일</td>
                <td className="border border-gray-300 px-3 py-2">{insp.inspection_date}</td>
                <td className="border border-gray-300 px-3 py-2 w-28 bg-gray-50 font-medium text-gray-700">점검자</td>
                <td className="border border-gray-300 px-3 py-2">{insp.inspector_name}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">점검구역</td>
                <td className="border border-gray-300 px-3 py-2">{insp.inspection_area}</td>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">상태</td>
                <td className="border border-gray-300 px-3 py-2">{insp.status}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-medium text-gray-700">결과 요약</td>
                <td colSpan={3} className="border border-gray-300 px-3 py-2">
                  전체 {totalItems}항목 —
                  <span className="text-green-700 font-medium ml-2">양호 {양호Count}</span>
                  <span className="text-amber-600 font-medium ml-2">보통 {보통Count}</span>
                  <span className="text-red-600 font-medium ml-2">불량 {불량Count}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 점검항목 결과 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">점검항목 결과</h2>

          {categories.map(([category, catItems], ci) => (
            <table key={ci} className="w-full border-collapse text-sm mb-0">
              <thead>
                <tr className="bg-gray-100">
                  <th colSpan={6} className="border border-gray-300 px-3 py-1.5 text-left font-bold">
                    {category}
                  </th>
                </tr>
                <tr className="bg-gray-50 text-xs">
                  <th className="border border-gray-300 px-2 py-1 w-8 text-center">번호</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">점검항목</th>
                  <th className="border border-gray-300 px-2 py-1 w-12 text-center">양호</th>
                  <th className="border border-gray-300 px-2 py-1 w-12 text-center">보통</th>
                  <th className="border border-gray-300 px-2 py-1 w-12 text-center">불량</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">지적사항 / 조치내용</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item, ii) => (
                  <tr key={item.id} className={item.condition_status === "불량" ? "bg-red-50" : ""}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-500">{ii + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-xs">{item.item_text}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-green-700">
                      {conditionSymbol(item.condition_status, "양호")}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-amber-600">
                      {conditionSymbol(item.condition_status, "보통")}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-red-600">
                      {conditionSymbol(item.condition_status, "불량")}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-xs">
                      {item.issue_description && (
                        <span className="text-red-700">⚠ {item.issue_description}</span>
                      )}
                      {item.action_note && (
                        <span className="text-gray-600 ml-1">→ {item.action_note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </section>

        {/* 연계 시정조치 */}
        {actions.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">
              연계 시정조치 ({actions.length}건)
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs">
                  <th className="border border-gray-300 px-3 py-2 w-8 text-center">번호</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium">문제항목</th>
                  <th className="border border-gray-300 px-3 py-2 w-24 text-center font-medium">담당자</th>
                  <th className="border border-gray-300 px-3 py-2 w-28 text-center font-medium">조치기한</th>
                  <th className="border border-gray-300 px-3 py-2 w-20 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={a.id}>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">{a.issue_title}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs">{a.assigned_to ?? "-"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs">{a.due_date ?? "-"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 날인란 */}
        <section className="mt-10 border-t border-gray-300 pt-6">
          <div className="grid grid-cols-3 gap-8 text-center text-sm">
            {["점 검 자", "안전보건관리책임자", "소 장"].map((label) => (
              <div key={label}>
                <p className="font-medium text-gray-700 mb-8">{label}</p>
                <div className="border-b border-gray-400 h-12" />
                <p className="text-xs text-gray-400 mt-1">(서명 또는 날인)</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
