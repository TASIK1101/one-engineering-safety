// ── 작업허가서 등급별 유형 목록 ───────────────────────────────

export const PERMIT_TYPES_A = [
  '밀폐구역 내 화기작업',
  '방사선 RT검사',
  '아르곤/질소가스 작업',
  '압력테스트 30bar 이상',
  '중량물 권상 작업',
  '고소작업',
  '맨 바스켓 작업',
  '밀폐구역 내 도장작업',
  '밀폐구역 내 아르곤/비활성가스 퍼징',
  '밀폐구역 내 압력테스트',
] as const;

export const PERMIT_TYPES_B = [
  '선박 유류 취급 작업',
  '압력테스트 30bar 이하',
  '중량물 권상 50ton 이상',
  '화기작업',
  '6m 이상 고소작업',
  'Drop zone 내 작업',
  '도장작업',
  '레일 위 작업',
  '밀폐구역 LEVEL2 작업',
] as const;

export type PermitGrade = 'A' | 'B';

/** 등급에 해당하는 허가 유형 목록 반환 */
export function getPermitTypes(grade: PermitGrade): readonly string[] {
  return grade === 'A' ? PERMIT_TYPES_A : PERMIT_TYPES_B;
}

// ── 특수 조건 판별 ─────────────────────────────────────────────

const CONFINED_SPACE_TYPES: string[] = [
  '밀폐구역 내 화기작업',
  '밀폐구역 내 도장작업',
  '밀폐구역 내 아르곤/비활성가스 퍼징',
  '밀폐구역 내 압력테스트',
  '밀폐구역 LEVEL2 작업',
];

/** 밀폐구역 관련 허가서 여부 */
export function isConfinedSpace(permitType: string): boolean {
  return CONFINED_SPACE_TYPES.includes(permitType);
}

/** 레일 위 작업 여부 (관련 협력사 합의 섹션) */
export function isRailWork(permitType: string): boolean {
  return permitType === '레일 위 작업';
}

// ── 상태 배지 색상 ─────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  작성중:   'bg-gray-100 text-gray-700 border-gray-300',
  서명중:   'bg-blue-100 text-blue-700 border-blue-200',
  검토중:   'bg-amber-100 text-amber-700 border-amber-200',
  승인완료: 'bg-green-100 text-green-700 border-green-200',
  반려:     'bg-red-100 text-red-700 border-red-200',
  작업중지: 'bg-red-600 text-white border-red-700',
};

/** A/B 등급 배지 색상 */
export const GRADE_COLORS: Record<string, string> = {
  A: 'bg-red-50 text-red-700 border-red-200',
  B: 'bg-orange-50 text-orange-700 border-orange-200',
};
