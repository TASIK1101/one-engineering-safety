/**
 * 비상조치 및 위기대응 모듈 공용 상수 및 유틸리티
 */

import type {
  EmergencyEquipmentStatus,
  StopWorkStatus,
  DrillResultStatus,
} from "@/types";

export const EMERGENCY_CONTACT_TYPES = [
  "사내",
  "원청",
  "소방",
  "경찰",
  "병원",
  "기타",
] as const;

export const EMERGENCY_EQUIPMENT_CATEGORIES = [
  "소화기",
  "구급함",
  "들것",
  "비상조명",
  "구조장비",
  "보호구",
  "기타",
] as const;

export const EQUIPMENT_STATUSES: EmergencyEquipmentStatus[] = [
  "정상",
  "점검필요",
  "사용불가",
  "교체예정",
];

export const STOP_WORK_STATUSES: StopWorkStatus[] = [
  "작업중지",
  "조치중",
  "재개승인",
  "종료",
];

export const DRILL_RESULT_STATUSES: DrillResultStatus[] = [
  "작성중",
  "검토중",
  "완료",
];

export const SCENARIO_TYPES = [
  "화재",
  "폭발",
  "화학물질 누출",
  "붕괴·낙하",
  "인명사고",
  "기타",
] as const;

export const DRILL_TYPES = [
  "종합훈련",
  "화재대피훈련",
  "응급처치훈련",
  "화학물질대응훈련",
  "기타",
] as const;

export const EMERGENCY_FILES_BUCKET = "emergency-files";

/** 시나리오 섹션 라벨 (상세/인쇄 공용) */
export const SCENARIO_SECTIONS = [
  { key: "initial_response", label: "초기 대응" },
  { key: "evacuation_actions", label: "대피 조치" },
  { key: "rescue_actions", label: "구조 및 구호 조치" },
  { key: "hazard_removal_actions", label: "위험요인 제거" },
  { key: "secondary_damage_prevention", label: "추가 피해 방지" },
  { key: "reporting_actions", label: "신고 및 연락 순서" },
  { key: "role_assignments", label: "담당자 역할" },
] as const;

/** 장비 상태 → Tailwind 배지 색상 */
export function equipmentStatusStyle(status: string): string {
  const map: Record<string, string> = {
    정상: "bg-green-50 text-green-700 border-green-200",
    점검필요: "bg-amber-50 text-amber-700 border-amber-200",
    사용불가: "bg-red-50 text-red-700 border-red-200",
    교체예정: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

/** 작업중지 상태 → Tailwind 배지 색상 */
export function stopWorkStatusStyle(status: string): string {
  const map: Record<string, string> = {
    작업중지: "bg-red-600 text-white border-red-700",
    조치중: "bg-blue-50 text-blue-700 border-blue-200",
    재개승인: "bg-amber-50 text-amber-700 border-amber-200",
    종료: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

/** 훈련 상태 → Tailwind 배지 색상 */
export function drillStatusStyle(status: string): string {
  const map: Record<string, string> = {
    작성중: "bg-gray-100 text-gray-600 border-gray-200",
    검토중: "bg-amber-50 text-amber-700 border-amber-200",
    완료: "bg-green-50 text-green-700 border-green-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

/** 다음 점검 예정일이 임박(기본 30일 이내)했거나 지났는지 */
export function isInspectionDue(
  nextDate: string | null | undefined,
  withinDays = 30
): boolean {
  if (!nextDate) return false;
  const target = new Date(nextDate + "T00:00:00").getTime();
  if (isNaN(target)) return false;
  return (target - Date.now()) / (1000 * 60 * 60 * 24) <= withinDays;
}

/** 저장된 값을 emergency-files 파일 접근 URL로 정규화 (path만 저장된 경우 public URL 조립) */
export function resolveEmergencyFileUrl(
  value: string | null | undefined
): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  const cleanPath = v.startsWith(`${EMERGENCY_FILES_BUCKET}/`)
    ? v.slice(EMERGENCY_FILES_BUCKET.length + 1)
    : v;
  return `${base}/storage/v1/object/public/${EMERGENCY_FILES_BUCKET}/${cleanPath}`;
}
