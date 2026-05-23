export const WORK_TYPES = [
  { value: "철의장", label: "철의장" },
  { value: "목의장", label: "목의장" },
  { value: "보온", label: "보온" },
  { value: "피복", label: "피복" },
  { value: "전기", label: "전기" },
  { value: "도장", label: "도장" },
  { value: "기타", label: "기타" },
] as const;

export type WorkTypeValue = (typeof WORK_TYPES)[number]["value"];

// ── 공종별 기본 위험요인 ───────────────────────────────────────
// DB(tbm_templates)에 템플릿이 없을 때 사용하는 하드코딩 fallback
export const WORK_TYPE_HAZARD_ITEMS: Record<string, string[]> = {
  철의장: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "작업 전·후 작업 주변 정리정돈 및 청소",
    "밀폐구역 작업 시 작업허가서 비치, 산소농도 측정, 환기팬 설치, 조도 확보",
    "자재 권상작업 시 2인 이상 작업 및 신호체계 준수",
    "일일점검 및 지공구 점검",
    "화기·용접 작업 시 불꽃 및 열로 인한 화재 주의",
    "용접 작업 시 작업허가서 및 MSDS 확인",
    "고소작업 시 2인 이상 작업 및 안전벨트 체결",
  ],
  목의장: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "자재 운반 및 설치 작업 시 협착, 충돌, 낙하 위험 주의",
    "고소작업 시 안전벨트 체결 및 2인 이상 작업",
    "작업구간 개구부, 통로, 적치 상태 확인",
    "수공구 및 전동공구 사용 전 이상 여부 점검",
    "중량물 취급 시 무리한 자세 금지",
    "작업 전 작업허가서 필요 여부 확인",
    "작업 종료 후 자재 및 공구 정리정돈",
  ],
  보온: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "분진, 섬유, 절단물에 의한 호흡기 및 피부 자극 주의",
    "방진마스크, 보안경, 장갑 착용 확인",
    "작업구역 환기 상태 확인",
    "절단공구 사용 시 베임 및 협착 위험 주의",
    "고소작업 시 안전벨트 체결 및 추락 위험 확인",
    "작업 후 폐기물 및 잔재물 정리",
    "작업구간 통로 확보",
  ],
  피복: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "작업에 적합한 보호구 착용",
    "작업구역 환기 및 조도 확인",
    "화기 주변 작업 시 불꽃, 열, 가연물 주의",
    "고소작업 시 안전벨트 체결",
    "자재 운반 시 낙하, 충돌, 협착 위험 주의",
    "작업 전 작업허가서 필요 여부 확인",
    "작업 종료 후 잔재물과 폐기물 정리",
    "위험한 행동 금지",
  ],
  전기: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "전기 작업 전 전원 차단 및 잠금/태그아웃 확인",
    "절연장갑, 절연화, 보안경 착용",
    "젖은 손이나 발로 전기 기기 조작 금지",
    "전선 피복 손상 여부 확인",
    "분전반 및 전기 설비 주변 정리정돈",
    "고소작업 시 안전벨트 체결 및 2인 이상 작업",
    "작업 전 작업허가서 및 안전점검표 확인",
  ],
  도장: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "방독마스크, 보안경, 보호복 착용",
    "작업구역 환기 상태 확인 (밀폐공간 특히 주의)",
    "도료 및 용제의 MSDS 확인 및 화기 주의",
    "인화성 물질 주변 화기 작업 금지",
    "도료 및 희석제 취급 시 피부 접촉 주의",
    "고소작업 시 안전벨트 체결",
    "작업 종료 후 폐도료 및 폐용제 분리 처리",
  ],
  기타: [
    "개인 보호구 착용 확인, 개인 건강 상태 체크",
    "작업 전·후 작업 주변 정리정돈 및 청소",
    "위험한 행동 금지",
    "고소작업 시 안전벨트 체결 및 2인 이상 작업",
    "작업 전 작업허가서 필요 여부 확인",
    "중량물 취급 시 무리한 자세 금지",
    "작업 종료 후 자재 및 공구 정리",
  ],
};

/** 공종에 맞는 기본 위험요인 반환 (DB 템플릿 없을 때 fallback용) */
export function getDefaultHazardItems(workType: string): string[] {
  return WORK_TYPE_HAZARD_ITEMS[workType] ?? WORK_TYPE_HAZARD_ITEMS["기타"];
}

/** 하위 호환 — 기존 코드가 DEFAULT_HAZARD_ITEMS를 import하는 경우 대비 */
export const DEFAULT_HAZARD_ITEMS = WORK_TYPE_HAZARD_ITEMS["기타"];

export function getTbmStatusColor(status: string): string {
  const map: Record<string, string> = {
    작성중: "bg-gray-100 text-gray-600 border-gray-200",
    서명중: "bg-blue-50 text-blue-700 border-blue-200",
    검토중: "bg-yellow-50 text-yellow-700 border-yellow-200",
    완료: "bg-green-50 text-green-700 border-green-200",
    반려: "bg-red-50 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
}
