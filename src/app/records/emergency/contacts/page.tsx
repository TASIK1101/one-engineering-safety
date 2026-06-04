export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PrintButton from "@/components/ui/PrintButton";
import { EMERGENCY_CONTACT_TYPES } from "@/lib/emergency";
import type { EmergencyContact } from "@/types";

export default async function EmergencyContactsPrintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("admin_id", user!.id)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const contacts = (data ?? []) as EmergencyContact[];
  const today = new Date().toLocaleDateString("ko-KR");

  // 유형별 그룹
  const grouped = EMERGENCY_CONTACT_TYPES.map((type) => ({
    type,
    items: contacts.filter((c) => c.contact_type === type),
  })).filter((g) => g.items.length > 0);
  const others = contacts.filter((c) => !EMERGENCY_CONTACT_TYPES.includes(c.contact_type as typeof EMERGENCY_CONTACT_TYPES[number]));
  if (others.length > 0) grouped.push({ type: "기타" as typeof EMERGENCY_CONTACT_TYPES[number], items: others });

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between max-w-4xl mx-auto mb-6">
        <Link href="/emergency/contacts" className="text-sm text-gray-500 hover:text-gray-700">← 비상연락망</Link>
        <PrintButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:p-4">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/one-engineering-logo.png" alt="주식회사 원엔지니어링" className="h-10 object-contain mx-auto mb-1" />
          <p className="text-sm text-gray-600 mb-1">주식회사 원엔지니어링</p>
          <h1 className="text-xl font-bold text-gray-900">비상연락망</h1>
          <p className="text-xs text-gray-500 mt-1">출력일: {today}</p>
        </div>

        {contacts.length === 0 ? (
          <p className="text-center text-gray-400 py-12">등록된 비상연락처가 없습니다.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.type} className="mb-6">
              <h2 className="text-sm font-bold bg-gray-100 border border-gray-300 px-3 py-1.5">{g.type}</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 w-1/3">기관명</th>
                    <th className="border border-gray-300 px-2 py-2 w-24">담당자</th>
                    <th className="border border-gray-300 px-2 py-2 w-32">전화번호</th>
                    <th className="border border-gray-300 px-2 py-2 w-32">보조 전화</th>
                    <th className="border border-gray-300 px-2 py-2">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((c) => (
                    <tr key={c.id}>
                      <td className="border border-gray-300 px-2 py-1.5 font-medium">{c.organization_name}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{c.contact_name ?? "-"}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{c.phone}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{c.secondary_phone ?? "-"}</td>
                      <td className="border border-gray-300 px-2 py-1.5">{c.description ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        <div className="border-t border-gray-300 mt-8 pt-3 flex justify-between text-xs text-gray-500">
          <span>주식회사 원엔지니어링</span>
          <span>출력일시: {new Date().toLocaleString("ko-KR")}</span>
        </div>
      </div>
    </div>
  );
}
