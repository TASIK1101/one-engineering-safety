"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import CertificateUpload from "@/components/ppe/CertificateUpload";
import { PPE_CATEGORIES } from "@/lib/ppe";
import type { PpeItem } from "@/types";

interface Props {
  /** 수정 모드일 때 기존 품목 */
  item?: PpeItem;
}

export default function PpeItemForm({ item }: Props) {
  const router = useRouter();
  const isEdit = !!item;

  const [form, setForm] = useState({
    item_name: item?.item_name ?? "",
    category: item?.category ?? "",
    model_name: item?.model_name ?? "",
    manufacturer: item?.manufacturer ?? "",
    certification_number: item?.certification_number ?? "",
    certification_date: item?.certification_date ?? "",
    certification_agency: item?.certification_agency ?? "",
    replacement_cycle_months: item?.replacement_cycle_months?.toString() ?? "",
    description: item?.description ?? "",
  });
  const [certUrl, setCertUrl] = useState<string | null>(item?.certificate_file_url ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.item_name.trim()) {
      setError("품목명을 입력해주세요.");
      return;
    }
    if (!form.category) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    setLoading(true);

    const payload = {
      ...(isEdit ? { id: item!.id } : {}),
      item_name: form.item_name.trim(),
      category: form.category,
      model_name: form.model_name.trim(),
      manufacturer: form.manufacturer.trim(),
      certification_number: form.certification_number.trim(),
      certification_date: form.certification_date || undefined,
      certification_agency: form.certification_agency.trim(),
      certificate_file_url: certUrl ?? "",
      replacement_cycle_months: form.replacement_cycle_months
        ? parseInt(form.replacement_cycle_months, 10)
        : null,
      description: form.description.trim(),
    };

    const endpoint = isEdit ? "/api/ppe/items/update" : "/api/ppe/items/create";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(
        data.error === "item_name_and_category_required"
          ? "품목명과 카테고리는 필수입니다."
          : `품목 저장 실패: ${data.detail ?? data.error ?? "알 수 없는 오류"}`
      );
      return;
    }

    const targetId = isEdit ? item!.id : data.id;
    router.push(`/ppe/items/${targetId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="품목명 *"
          value={form.item_name}
          onChange={(e) => update("item_name", e.target.value)}
          placeholder="예: 안전대 KJ052-DS02"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">카테고리 *</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">선택하세요</option>
            {PPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="모델명" value={form.model_name} onChange={(e) => update("model_name", e.target.value)} placeholder="예: KJ052-DS02" />
        <Input label="제조사" value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="안전인증번호" value={form.certification_number} onChange={(e) => update("certification_number", e.target.value)} placeholder="예: 11-AV2CY-0157" />
        <Input label="인증일자" type="date" value={form.certification_date} onChange={(e) => update("certification_date", e.target.value)} />
        <Input label="인증기관" value={form.certification_agency} onChange={(e) => update("certification_agency", e.target.value)} placeholder="한국산업안전보건공단" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="교체 주기 (개월)"
          type="number"
          min={0}
          value={form.replacement_cycle_months}
          onChange={(e) => update("replacement_cycle_months", e.target.value)}
          placeholder="예: 36"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">인증서 파일</label>
        <CertificateUpload
          folder={`items/${isEdit ? item!.id : "new"}`}
          initialUrl={certUrl}
          onUpload={(url) => setCertUrl(url)}
          disabled={loading}
        />
      </div>

      <Textarea label="비고" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="예: 안전그네식, 1개걸이용" rows={3} />

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="bg-blue-600 hover:bg-blue-700">
          {isEdit ? "수정 저장" : "품목 등록"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
          취소
        </Button>
      </div>
    </form>
  );
}
