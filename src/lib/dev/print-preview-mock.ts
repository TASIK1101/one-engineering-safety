// ── 개발·Preview 전용 인쇄 테스트 mock 데이터 ─────────────────────
// 운영 DB를 일절 조회/수정하지 않고, 코드 내부에서만 더미 데이터를 생성한다.
// 전화번호 뒷자리 등 개인정보성 필드는 생성하지 않는다 (phone_last4: null).

import type {
  TbmRecord,
  TbmAttendee,
  TbmApproval,
  Training,
  TrainingAssignment,
  Employee,
  WorkPermit,
  WorkPermitItem,
  WorkPermitWorker,
  WorkPermitApproval,
  WorkPermitGasMeasurement,
  ConfinedSpaceEntryLog,
  RelatedCompanyAgreement,
} from "@/types";

// ── 환경 가드 ──────────────────────────────────────────────────

/** 개발 / Vercel Preview / 명시적 환경변수에서만 true. 운영에서는 false. */
export function printPreviewEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.ENABLE_PRINT_PREVIEW === "true") return true;
  return false;
}

// ── 인원 수 / 시나리오 선택 ────────────────────────────────────

export const PREVIEW_COUNTS = [0, 1, 10, 25, 50, 55, 70] as const;

export function parsePreviewCount(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PREVIEW_COUNTS as readonly number[]).includes(n) ? n : 55;
}

export const PERMIT_SCENARIOS = ["general", "confined", "rail", "rejected"] as const;
export type PermitScenario = (typeof PERMIT_SCENARIOS)[number];

export const PERMIT_SCENARIO_LABELS: Record<PermitScenario, string> = {
  general: "일반 (승인완료)",
  confined: "밀폐구역 (가스측정·출입대장)",
  rail: "레일 위 작업 (협력사 합의)",
  rejected: "반려 (반려 사유 표시)",
};

export function parsePermitScenario(raw: string | string[] | undefined): PermitScenario {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (PERMIT_SCENARIOS as readonly string[]).includes(v ?? "")
    ? (v as PermitScenario)
    : "general";
}

// ── 더미 인적사항 생성 ────────────────────────────────────────

const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const GIVEN_NAMES = ["민준", "서연", "도윤", "하은", "지호", "수아", "예준", "지우", "건우", "서준", "현우", "유진", "지민", "태양"];
const DEPARTMENTS = ["배관", "용접", "전기", "도장", "기계설치", "비계", "보온", "품질관리"];
const COMPANIES = ["원엔지니어링", "대한산업", "한빛테크", "세진ENG"];

/** lcm(10, 14) = 70 → 70명까지 중복 없는 이름 */
export function mockName(i: number): string {
  return SURNAMES[i % SURNAMES.length] + GIVEN_NAMES[i % GIVEN_NAMES.length];
}

function mockDepartment(i: number): string {
  return DEPARTMENTS[i % DEPARTMENTS.length];
}

function mockCompany(i: number): string {
  return COMPANIES[i % COMPANIES.length];
}

// 기준 시각: 출력마다 흔들리지 않도록 고정
const BASE_TIME = new Date("2026-06-10T08:00:00+09:00").getTime();

function mockTime(i: number): string {
  return new Date(BASE_TIME + i * 90_000).toISOString();
}

/** SVG 기반 mock 서명 이미지 (data URL). 이름이 보여 식별 가능. */
export function mockSignatureDataUrl(name: string, i: number): string {
  const wob = (i % 5) * 4;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60">` +
    `<path d="M10 ${44 - wob / 2} C 40 ${8 + wob}, 70 ${52 - wob}, 100 ${24 + wob} S 150 ${40 - wob}, 172 ${16 + wob}" ` +
    `fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" opacity="0.65"/>` +
    `<text x="90" y="40" font-size="22" text-anchor="middle" fill="#111827" ` +
    `font-family="sans-serif" font-weight="bold">${name}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── TBM mock ──────────────────────────────────────────────────

export function mockTbmRecord(): TbmRecord {
  return {
    id: "mock-tbm-id",
    admin_id: "mock-admin",
    date: "2026-06-10",
    month: "2026-06",
    company: "대한산업 (mock)",
    worksite_id: null,
    worksite_location: "제2공장 동측 야드 (테스트 데이터)",
    work_type: "배관 설치",
    process_name: "메인 라인 용접",
    supervisor: "김감독 (mock)",
    safety_manager: "이안전 (mock)",
    site_manager: "박소장 (mock)",
    hazard_items: [
      "고소작업 시 안전벨트 체결 확인",
      "용접 불티 비산 방지포 설치",
      "중량물 인양 시 신호수 배치",
    ],
    main_hazard_notes: "우천 후 바닥 미끄럼 주의 (mock 데이터)",
    accident_case_notes: "타 현장 추락 사고 사례 전파 (mock 데이터)",
    education_done: true,
    status: "완료",
    sign_token: "mock-sign-token",
    created_by: null,
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    author_employee_id: null,
    safety_manager_employee_id: null,
    representative_employee_id: null,
    author_is_safety_manager: false,
    require_representative_approval: true,
    locked_at: null,
    created_at: mockTime(0),
    updated_at: mockTime(0),
  };
}

export function mockTbmAttendees(count: number): TbmAttendee[] {
  return Array.from({ length: count }, (_, i) => {
    const name = mockName(i);
    // 일부 미서명/불참 케이스 포함
    const status: TbmAttendee["attendance_status"] =
      i % 13 === 12 ? "불참" : i % 7 === 6 ? "대기" : "서명완료";
    const signed = status === "서명완료";
    return {
      id: `mock-att-${i}`,
      tbm_record_id: "mock-tbm-id",
      employee_id: null,
      employee_name: name,
      attendance_status: status,
      signature_data: signed ? mockSignatureDataUrl(name, i) : null,
      signed_at: signed ? mockTime(i) : null,
      created_at: mockTime(0),
    };
  });
}

export function mockTbmApprovals(): TbmApproval[] {
  return (["안전전담자", "소장대표"] as const).map((role, i) => {
    const name = role === "안전전담자" ? "이안전" : "박소장";
    return {
      id: `mock-tbm-appr-${i}`,
      tbm_record_id: "mock-tbm-id",
      approver_role: role,
      approver_employee_id: null,
      approver_name: name,
      approval_status: "승인" as const,
      signature_data: mockSignatureDataUrl(name, i),
      rejection_reason: null,
      approved_at: mockTime(100 + i),
      approval_token: `mock-token-${i}`,
      signed_ip: null,
      signed_user_agent: null,
      created_at: mockTime(0),
    };
  });
}

// ── 안전교육 mock ─────────────────────────────────────────────

export function mockTraining(): Training {
  return {
    id: "mock-training-id",
    admin_id: "mock-admin",
    title: "2026년 6월 정기 안전교육 (인쇄 테스트)",
    description: "출력 구조 검증용 mock 교육 데이터입니다.",
    content:
      "1. 추락 재해 예방 수칙\n2. 보호구 착용 기준\n3. 밀폐공간 작업 절차\n4. 비상 상황 대응 요령\n\n※ 본 내용은 인쇄 테스트용 mock 데이터입니다.",
    quizzes: [
      { question: "안전벨트는 고소작업 시 반드시 체결해야 한다.", answer: "O" },
      { question: "밀폐공간은 산소농도 측정 없이 출입해도 된다.", answer: "X" },
      { question: "불티 비산 방지포는 화기작업 전 설치한다.", answer: "O" },
    ],
    training_type: "regular_training",
    created_at: mockTime(0),
    work_date: null,
    work_name: null,
    work_location: null,
    risk_factors: null,
    ppe_check: null,
    daily_notice: null,
    instructor: "이안전 (mock)",
    confirmed_at: mockTime(200),
    confirmed_by: "이안전 (mock)",
    confirmation_memo: "전원 이수 확인 (mock)",
  };
}

export function mockEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-emp-${i}`,
    admin_id: "mock-admin",
    name: mockName(i),
    phone: "",
    department: mockDepartment(i),
    created_at: mockTime(0),
  }));
}

export function mockTrainingAssignments(employees: Employee[]): TrainingAssignment[] {
  return employees
    .map((emp, i) => {
      // 일부 미이수 케이스: assignment 자체가 없는 직원
      if (i % 6 === 5) return null;
      const completed = i % 9 !== 8;
      return {
        id: `mock-assign-${i}`,
        training_id: "mock-training-id",
        employee_id: emp.id,
        token: `mock-token-${i}`,
        status: completed ? ("completed" as const) : ("pending" as const),
        quiz_answers: completed
          ? ([i % 11 === 10 ? "X" : "O", "X", "O"] as ("O" | "X")[])
          : null,
        signature_data: completed ? mockSignatureDataUrl(emp.name, i) : null,
        started_at: completed ? mockTime(i) : null,
        completed_at: completed ? mockTime(i + 3) : null,
        duration_seconds: completed ? 180 + (i % 7) * 40 : null,
        consent_checked: completed,
        created_at: mockTime(0),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
}

// ── 작업허가서 mock ───────────────────────────────────────────

const SCENARIO_PERMIT: Record<PermitScenario, { grade: "A" | "B"; permit_type: string }> = {
  general: { grade: "B", permit_type: "화기작업" },
  confined: { grade: "A", permit_type: "밀폐구역 내 화기작업" },
  rail: { grade: "B", permit_type: "레일 위 작업" },
  rejected: { grade: "B", permit_type: "화기작업" },
};

export function mockWorkPermit(scenario: PermitScenario): WorkPermit {
  const { grade, permit_type } = SCENARIO_PERMIT[scenario];
  const rejected = scenario === "rejected";
  return {
    id: "mock-permit-id",
    admin_id: "mock-admin",
    permit_token: "mock-permit-token",
    grade,
    permit_type,
    title: `${grade}급 작업허가서 — ${permit_type}`,
    work_company: "대한산업 (mock)",
    work_department: "생산1팀",
    work_period_start: "2026-06-10",
    work_period_end: "2026-06-12",
    work_location: "제2공장 동측 야드 (테스트 데이터)",
    work_name: "메인 배관 라인 교체 작업 (인쇄 테스트)",
    worker_count: null,
    supervisor_name: "김감독 (mock)",
    emergency_contact: "내선 119",
    ventilation_method: scenario === "confined" ? "강제 급배기 (송풍기 2대)" : null,
    watcher_name: scenario === "confined" ? "최감시 (mock)" : null,
    status: rejected ? "반려" : "승인완료",
    rejection_reason: rejected ? "가스 측정 기록 미흡 — 재측정 후 재상신 바랍니다. (mock)" : null,
    created_by: null,
    approved_by: null,
    approved_at: rejected ? null : mockTime(300),
    author_employee_id: null,
    safety_manager_employee_id: null,
    representative_employee_id: null,
    locked_at: rejected ? null : mockTime(300),
    created_at: mockTime(0),
    updated_at: mockTime(0),
  };
}

export function mockPermitItems(): WorkPermitItem[] {
  const defs: [string, string, "신청" | "해당없음"][] = [
    ["화기작업", "소화기 비치 확인", "신청"],
    ["화기작업", "불티 비산 방지포 설치", "신청"],
    ["화기작업", "인근 가연물 제거", "신청"],
    ["보호구", "안전모/안전화 착용", "신청"],
    ["보호구", "용접면 및 보안경 착용", "신청"],
    ["기타", "방사선 차폐 조치", "해당없음"],
  ];
  return defs.map(([category, item_text, apply_status], i) => ({
    id: `mock-item-${i}`,
    permit_id: "mock-permit-id",
    category,
    item_text,
    apply_status,
    field_confirmed: apply_status === "신청",
    note: null,
    created_at: mockTime(0),
    updated_at: mockTime(0),
  }));
}

export function mockPermitWorkers(count: number): WorkPermitWorker[] {
  return Array.from({ length: count }, (_, i) => {
    const name = mockName(i);
    const signed = i % 7 !== 6; // 일부 미서명
    return {
      id: `mock-worker-${i}`,
      permit_id: "mock-permit-id",
      employee_id: null,
      worker_name: name,
      phone_last4: null, // 출력물에 전화번호 미노출 — mock에서도 생성하지 않음
      company_name: mockCompany(i),
      is_manual: false,
      signature_data: signed ? mockSignatureDataUrl(name, i) : null,
      signed_at: signed ? mockTime(i) : null,
      created_at: mockTime(0),
    };
  });
}

export function mockPermitApprovals(scenario: PermitScenario): WorkPermitApproval[] {
  const roles = ["작성자", "안전전담자", "소장대표"] as const;
  const names = ["김작성", "이안전", "박소장"];
  return roles.map((role, i) => {
    // 반려 시나리오: 작성자 승인 → 안전전담자 반려 → 소장대표 대기
    const status: WorkPermitApproval["approval_status"] =
      scenario === "rejected" ? (i === 0 ? "승인" : i === 1 ? "반려" : "대기") : "승인";
    return {
      id: `mock-appr-${i}`,
      permit_id: "mock-permit-id",
      approver_role: role,
      approver_name: status === "대기" ? "" : names[i],
      approver_employee_id: null,
      approval_status: status,
      signature_data: status === "승인" ? mockSignatureDataUrl(names[i], i) : null,
      rejection_reason: status === "반려" ? "가스 측정 기록 미흡 (mock)" : null,
      approved_at: status === "대기" ? null : mockTime(200 + i),
      approval_token: null,
      signed_ip: null,
      signed_user_agent: null,
      created_at: mockTime(0),
    };
  });
}

export function mockGasMeasurements(scenario: PermitScenario): WorkPermitGasMeasurement[] {
  if (scenario !== "confined") return [];
  return Array.from({ length: 4 }, (_, i) => ({
    id: `mock-gas-${i}`,
    permit_id: "mock-permit-id",
    measured_at: mockTime(i * 40),
    oxygen: 20.9 - i * 0.1,
    combustible_gas: i,
    carbon_monoxide: 2 + i,
    measured_by: "최감시 (mock)",
    created_at: mockTime(0),
  }));
}

export function mockEntryLogs(scenario: PermitScenario): ConfinedSpaceEntryLog[] {
  if (scenario !== "confined") return [];
  return Array.from({ length: 5 }, (_, i) => ({
    id: `mock-entry-${i}`,
    permit_id: "mock-permit-id",
    worker_name: mockName(i),
    entry_time: mockTime(i * 10),
    exit_time: i < 4 ? mockTime(i * 10 + 30) : null, // 마지막 1명은 작업 중
    note: i === 0 ? "선행 점검 입실" : null,
    created_at: mockTime(0),
  }));
}

export function mockAgreements(scenario: PermitScenario): RelatedCompanyAgreement[] {
  if (scenario !== "rail") return [];
  return Array.from({ length: 3 }, (_, i) => {
    const contact = mockName(30 + i);
    const signed = i !== 2; // 1개 업체는 미서명
    return {
      id: `mock-agree-${i}`,
      permit_id: "mock-permit-id",
      company_name: mockCompany(i),
      contact_name: contact,
      signature_data: signed ? mockSignatureDataUrl(contact, i) : null,
      signed_at: signed ? mockTime(50 + i) : null,
      created_at: mockTime(0),
    };
  });
}
