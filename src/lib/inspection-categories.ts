export const INSPECTION_CATEGORIES: { category: string; items: string[] }[] = [
  {
    category: "정리정돈",
    items: [
      "각종 호스, 케이블 정리정돈 상태",
      "블록 주변 청소 상태",
      "퇴근 종료시간 나눔 분리 상태",
      "안전통로 적재물 등 통로 확보 상태",
    ],
  },
  {
    category: "보호구",
    items: [
      "기본보호구 착용 상태",
      "추가보호구 착용 상태",
      "작업에 적합한 보호구 착용 여부",
    ],
  },
  {
    category: "작업장 상태",
    items: [
      "이동용 승강대 파손 여부",
      "각종 호스류 누설 상태",
      "블록 내 환기/배기 상태",
      "고철, 오물 등 방치 상태",
      "낙하물, 고박물 상태",
      "기자재 적치 상태",
    ],
  },
  {
    category: "고소작업",
    items: [
      "난간대 및 사다리 설치 상태",
      "개구부 덮개 및 추락방지조치 여부",
      "2m 이상 고소작업 시 안전벨트 체결 상태",
      "작업허가서 통제 여부",
    ],
  },
  {
    category: "의장품 리깅 작업",
    items: [
      "레버/체인블록 상태 및 훅 해지장치 볼트 점검",
      "와이어로프/슬링벨트 상태 점검",
      "클램프, 샤클 등 달기구 점검",
      "안전한 고정점 체결 여부",
    ],
  },
  {
    category: "화기/용접 작업",
    items: [
      "불티 비산방지 및 가연물 제거 여부",
      "불감시자 배치 및 소화기 배치 여부",
      "아르곤 등 질식위험 가스 취급 시 경고표지 여부",
    ],
  },
  {
    category: "장비 사용",
    items: [
      "화물차 자재 고박 및 사내 속도 준수",
      "지게차 회전반경 및 사내 속도 준수",
      "크레인 권상각도, 신호, 권상물 하부 통제 상태",
    ],
  },
];

export type ConditionStatus = "양호" | "보통" | "불량";

export function getConditionColor(status: ConditionStatus | string): string {
  switch (status) {
    case "양호":
      return "bg-green-100 text-green-800";
    case "보통":
      return "bg-amber-100 text-amber-800";
    case "불량":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getCorrectiveActionStatusColor(status: string): string {
  switch (status) {
    case "대기":
      return "bg-gray-100 text-gray-800";
    case "조치중":
      return "bg-blue-100 text-blue-800";
    case "검토중":
      return "bg-amber-100 text-amber-800";
    case "완료":
      return "bg-green-100 text-green-800";
    case "반려":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
