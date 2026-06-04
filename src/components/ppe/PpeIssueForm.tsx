"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { calcReplacementDate } from "@/lib/ppe";
import type { Employee, PpeItem } from "@/types";

interface Props {
  employees: Pick<Employee, "id" | "name" | "department">[];
  items: Pick<PpeItem, "id" | "item_name" | "category" | "replacement_cycle_months">[];
  /** 미리 선택할 직원 (직원 상세에서 진입 시) */
  presetEmployeeId?: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PpeIssueForm({ employees, items, presetEmployeeId }: Props) {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState(presetEmployeeId ?? "");
  const [empQuery, setEmpQuery] = useState("");
  const [itemId, setItemId] = useState("");
  const [issuedAt, setIssuedAt] = useState(todayStr());
  const [quantity, setQuantity] = useState("1");
  const [issueReason, setIssueReason] = useState("");
  const [note, setNote] = useState("");
  const [actorName, setActorName] = useState("");
  const [replacementOverride, setReplacementOverride] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedItem = items.find((i) => i.id === itemId);

  // 교체 예정일 자동 계산 (수동 입력이 있으면 그것을 우선)
  const autoReplacement = useMemo(
    () => calcReplacementDate(issuedAt, selectedItem?.replacement_cycle_months ?? null),
    [issuedAt, selectedItem]
  );
  const effectiveReplacement = replacementOverride || autoReplacement || "";

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
    );
  }, [empQuery, employees]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!employeeId) {
      setError("직원을 선택해주세요.");
      return;
    }
    if (!itemId) {
      setError("보호구 품목을 선택해주세요.");
      return;
    }
    if (!issuedAt) {
      setError("지급일을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/ppe/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        ppe_item_id: itemId,
        issued_at: issuedAt,
        quantity: parseInt(quantity, 10) || 1,
        issue_reason: issueReason.trim() || undefined,
        note: note.trim() || undefined,
        expected_replacement_date: replacementOverride || undefined,
        actor_name: actorName.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const map: Record<string, string> = {
        employee_required: "직원을 선택해주세요.",
        item_required: "보호구 품목을 선택해주세요.",
        issued_at_required: "지급일을 입력해주세요.",
        employee_not_found: "직원 정보를 찾을 수 없습니다.",
        item_not_found: "품목 정보를 찾을 수 없습니다.",
      };
      setError(map[data.error] ?? `지급 저장 실패: ${data.detail ?? data.error ?? "오류"}`);
      return;
    }

    router.push(`/ppe/employees/${employeeId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* 직원 선택 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">직원 선택 *</label>
        {!presetEmployeeId && (
          <Input
            value={empQuery}
            onChange={(e) => setEmpQuery(e.target.value)}
            placeholder="이름 또는 부서로 검색"
            className="mb-1"
          />
        )}
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          disabled={!!presetEmployeeId}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
        >
          <option value="">직원을 선택하세요</option>
          {filteredEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}{e.department ? ` (${e.department})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 품목 선택 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">보호구 품목 *</label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">품목을 선택하세요</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              [{i.category}] {i.item_name}
            </option>
          ))}
        </select>
        {items.length === 0 && (
          <p className="text-xs text-amber-600">
            등록된 활성 품목이 없습니다. 먼저 품목을 등록하세요.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="지급일 *" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        <Input label="수량" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Input
          label="교체 예정일"
          type="date"
          value={effectiveReplacement}
          onChange={(e) => setReplacementOverride(e.target.value)}
        />
      </div>
      <p className="-mt-3 text-xs text-gray-400">
        {selectedItem?.replacement_cycle_months
          ? `교체주기 ${selectedItem.replacement_cycle_months}개월 기준 자동 계산됨 (수정 가능)`
          : "선택한 품목에 교체주기가 없으면 자동 계산되지 않습니다 (직접 입력 가능)"}
      </p>

      <Input label="지급 담당자" value={actorName} onChange={(e) => setActorName(e.target.value)} placeholder="지급한 담당자 이름" />
      <Input label="지급 사유" value={issueReason} onChange={(e) => setIssueReason(e.target.value)} placeholder="예: 신규 입사 / 정기 교체" />
      <Textarea label="비고" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="bg-blue-600 hover:bg-blue-700">보호구 지급 등록</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>취소</Button>
      </div>
    </form>
  );
}
