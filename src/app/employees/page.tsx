export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import DeleteEmployeeButton from "@/components/admin/DeleteEmployeeButton";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            교육 대상자 관리
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            교육에 참여할 직원을 등록합니다.
          </p>
        </div>
        <Link href="/employees/new">
          <Button>+ 대상자 등록</Button>
        </Link>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">등록된 교육 대상자가 없습니다.</p>
          <Link href="/employees/new">
            <Button className="mt-4">첫 대상자 등록하기</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  이름
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  전화번호
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  부서 / 직급
                </th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">
                  등록일
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {emp.department || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(emp.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      교육 이력
                    </Link>
                    <DeleteEmployeeButton id={emp.id} name={emp.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
