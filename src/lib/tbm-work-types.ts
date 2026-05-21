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

export const DEFAULT_HAZARD_ITEMS: string[] = [
  "개인 보호구 착용 확인, 개인 건강 상태 체크",
  "작업 전·후 작업 주변 정리정돈 및 청소 실시",
  "위험한 행동 금지",
  "자체 권상작업 시 2인 이상 작업 및 신호체계 준수",
  "일일점검 및 지공구 점검 실시",
  "화기/용접 작업 시 불꽃, 열, 화기 주의",
  "용접 작업 시 작업허가서 및 MSDS 확인",
  "사상작업 시 청력손실 및 비산물 주의",
  "작업구간 청소상태와 개구부 확인",
  "작업 시작 전 용접기 전기상태 확인",
  "고소작업 시 2인 이상 작업 및 안전벨트 체결",
];

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
