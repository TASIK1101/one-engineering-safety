/**
 * 보호구(PPE) 모듈 공용 상수 및 유틸리티
 */

import type { PpeIssuanceStatus } from "@/types";

export const PPE_CATEGORIES = [
  "안전모",
  "안전대",
  "안전화",
  "보안경",
  "귀마개",
  "안전장갑",
  "방진마스크",
  "용접면",
  "기타",
] as const;

export const PPE_STATUSES: PpeIssuanceStatus[] = [
  "지급중",
  "반납완료",
  "교체완료",
  "분실",
  "폐기",
];

const PPE_CERT_BUCKET = "ppe-certificates";

/** 지급 상태 → Tailwind 배지 색상 */
export function ppeStatusStyle(status: string): string {
  const map: Record<string, string> = {
    지급중: "bg-blue-50 text-blue-700 border-blue-200",
    반납완료: "bg-gray-100 text-gray-600 border-gray-200",
    교체완료: "bg-amber-50 text-amber-700 border-amber-200",
    분실: "bg-red-50 text-red-700 border-red-200",
    폐기: "bg-slate-200 text-slate-600 border-slate-300",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

/**
 * 전화번호 일부 마스킹: 010-1234-5678 → 010-****-5678
 * 형식이 다르면 가운데를 최대한 가린다.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

/**
 * 교체 예정일 자동 계산: issued_at + cycleMonths 개월
 * cycleMonths 가 없으면 null 반환.
 */
export function calcReplacementDate(
  issuedAt: string,
  cycleMonths: number | null | undefined
): string | null {
  if (!issuedAt || !cycleMonths || cycleMonths <= 0) return null;
  const d = new Date(issuedAt + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + cycleMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 교체 예정일이 임박(30일 이내)했거나 지났는지 */
export function isReplacementDue(
  expectedDate: string | null,
  withinDays = 30
): boolean {
  if (!expectedDate) return false;
  const target = new Date(expectedDate + "T00:00:00").getTime();
  if (isNaN(target)) return false;
  const now = Date.now();
  const diffDays = (target - now) / (1000 * 60 * 60 * 24);
  return diffDays <= withinDays;
}

/** 저장된 값을 인증서 파일 접근 URL로 정규화 (path만 저장된 경우 public URL 조립) */
export function resolveCertUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  const cleanPath = v.startsWith(`${PPE_CERT_BUCKET}/`)
    ? v.slice(PPE_CERT_BUCKET.length + 1)
    : v;
  return `${base}/storage/v1/object/public/${PPE_CERT_BUCKET}/${cleanPath}`;
}

export { PPE_CERT_BUCKET };
