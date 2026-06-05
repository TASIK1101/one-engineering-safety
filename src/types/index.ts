export type Quiz = {
  question: string;
  answer: "O" | "X";
};

export type Employee = {
  id: string;
  admin_id: string;
  name: string;
  phone: string;
  department: string;
  created_at: string;
};

export type Training = {
  id: string;
  admin_id: string;
  title: string;
  description: string;
  content: string;
  quizzes: Quiz[];
  training_type: string;
  created_at: string;
  // 작업 전 안전교육 전용 필드
  work_date: string | null;
  work_name: string | null;
  work_location: string | null;
  risk_factors: string | null;
  ppe_check: string | null;
  daily_notice: string | null;
  instructor: string | null;
  // 교육 담당자 확인 필드
  confirmed_at: string | null;
  confirmed_by: string | null;
  confirmation_memo: string | null;
};

export type TrainingAssignment = {
  id: string;
  training_id: string;
  employee_id: string;
  token: string;
  status: "pending" | "completed";
  quiz_answers: ("O" | "X")[] | null;
  signature_data: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  consent_checked: boolean;
  created_at: string;
};

export type AssignmentWithRelations = TrainingAssignment & {
  employees: Employee;
  trainings: Training;
};

// ── TBM 모듈 ──────────────────────────────────────────────────

export type Worksite = {
  id: string;
  admin_id: string;
  site_name: string;
  project_name: string | null;
  location: string | null;
  active: boolean;
  created_at: string;
};

export type TbmTemplate = {
  id: string;
  admin_id: string;
  template_name: string;
  work_type: string;
  process_name: string | null;
  default_hazard_items: string[];
  active: boolean;
  created_at: string;
};

export type TbmRecord = {
  id: string;
  admin_id: string;
  date: string;
  month: string;
  company: string | null;
  worksite_id: string | null;
  worksite_location: string | null;
  work_type: string;
  process_name: string | null;
  supervisor: string | null;
  safety_manager: string | null;
  site_manager: string | null;
  hazard_items: string[];
  main_hazard_notes: string | null;
  accident_case_notes: string | null;
  education_done: boolean;
  status: "작성중" | "서명중" | "검토중" | "완료" | "반려";
  sign_token: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  // ── 역할별 전자확인(승인) 설정 ──
  author_employee_id: string | null;
  safety_manager_employee_id: string | null;
  representative_employee_id: string | null;
  author_is_safety_manager: boolean;
  require_representative_approval: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TbmAttendee = {
  id: string;
  tbm_record_id: string;
  employee_id: string | null;
  employee_name: string;
  attendance_status: "대기" | "서명완료" | "불참";
  signature_data: string | null;
  signed_at: string | null;
  created_at: string;
};

export type TbmApprovalRole = "안전전담자" | "소장대표";

export type TbmApproval = {
  id: string;
  tbm_record_id: string;
  approver_role: TbmApprovalRole;
  approver_employee_id: string | null;
  approver_name: string | null;
  approval_status: "대기" | "승인" | "반려";
  signature_data: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  approval_token: string;
  signed_ip: string | null;
  signed_user_agent: string | null;
  created_at: string;
};

// ── 작업허가서 모듈 ───────────────────────────────────────────

export type WorkPermitTemplate = {
  id: string;
  grade: 'A' | 'B';
  permit_type: string;
  title: string;
  checklist_items: WorkPermitChecklistItem[];
  approval_roles: string[];
  requires_gas_measurement: boolean;
  requires_entry_register: boolean;
  requires_related_company_agreement: boolean;
  active: boolean;
  created_at: string;
};

export type WorkPermitChecklistItem = {
  category: string;
  item_text: string;
};

export type WorkPermit = {
  id: string;
  admin_id: string;
  permit_token: string;
  grade: 'A' | 'B';
  permit_type: string;
  title: string;
  work_company: string | null;
  work_department: string | null;
  work_period_start: string | null;
  work_period_end: string | null;
  work_location: string | null;
  work_name: string | null;
  worker_count: number | null;
  supervisor_name: string | null;
  emergency_contact: string | null;
  ventilation_method: string | null;
  watcher_name: string | null;
  status: '작성중' | '서명중' | '검토중' | '승인완료' | '반려' | '작업중지';
  rejection_reason: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  author_employee_id: string | null;
  safety_manager_employee_id: string | null;
  representative_employee_id: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkPermitItem = {
  id: string;
  permit_id: string;
  category: string;
  item_text: string;
  apply_status: '신청' | '해당없음';
  field_confirmed: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkPermitWorker = {
  id: string;
  permit_id: string;
  employee_id: string | null;
  worker_name: string;
  phone_last4: string | null;
  company_name: string | null;
  is_manual: boolean;
  signature_data: string | null;
  signed_at: string | null;
  created_at: string;
};

export type WorkPermitApproval = {
  id: string;
  permit_id: string;
  approver_role: string;
  approver_name: string;
  approver_employee_id: string | null;
  approval_status: '대기' | '승인' | '반려';
  signature_data: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  approval_token: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  created_at: string;
};

export type WorkPermitGasMeasurement = {
  id: string;
  permit_id: string;
  measured_at: string;
  oxygen: number | null;
  combustible_gas: number | null;
  carbon_monoxide: number | null;
  measured_by: string | null;
  created_at: string;
};

export type ConfinedSpaceEntryLog = {
  id: string;
  permit_id: string;
  worker_name: string;
  entry_time: string | null;
  exit_time: string | null;
  note: string | null;
  created_at: string;
};

export type RelatedCompanyAgreement = {
  id: string;
  permit_id: string;
  company_name: string;
  contact_name: string | null;
  signature_data: string | null;
  signed_at: string | null;
  created_at: string;
};

// ── 안전점검 + 시정조치 모듈 ──────────────────────────────────

export type SafetyInspection = {
  id: string;
  admin_id: string;
  inspection_date: string;
  inspector_name: string;
  inspection_area: string;
  worksite_id: string | null;
  status: "작성중" | "완료";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SafetyInspectionItem = {
  id: string;
  inspection_id: string;
  category: string;
  item_text: string;
  location: string | null;
  condition_status: "양호" | "보통" | "불량";
  issue_description: string | null;
  action_note: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrectiveAction = {
  id: string;
  admin_id: string;
  inspection_id: string | null;
  inspection_item_id: string | null;
  issue_title: string;
  issue_description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  action_result: string | null;
  status: "대기" | "조치중" | "검토중" | "완료" | "반려";
  rejection_reason: string | null;
  completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── 보호구 지급·관리 모듈 ─────────────────────────────────────

export type PpeIssuanceStatus = "지급중" | "반납완료" | "교체완료" | "분실" | "폐기";
export type PpeActionType = "지급" | "반납" | "교체" | "분실" | "폐기" | "수정";

export type PpeItem = {
  id: string;
  admin_id: string;
  item_name: string;
  category: string;
  model_name: string | null;
  manufacturer: string | null;
  certification_number: string | null;
  certification_date: string | null;
  certification_agency: string | null;
  certificate_file_url: string | null;
  replacement_cycle_months: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PpeIssuance = {
  id: string;
  admin_id: string;
  employee_id: string;
  ppe_item_id: string;
  issued_at: string;
  quantity: number;
  status: PpeIssuanceStatus;
  expected_replacement_date: string | null;
  returned_at: string | null;
  replaced_at: string | null;
  issue_reason: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PpeIssueHistory = {
  id: string;
  issuance_id: string;
  action_type: PpeActionType;
  action_date: string;
  actor_name: string | null;
  note: string | null;
  created_at: string;
};

export type PpeCertificate = {
  id: string;
  ppe_item_id: string;
  certificate_name: string;
  certification_number: string | null;
  certification_date: string | null;
  certification_agency: string | null;
  model_name: string | null;
  manufacturer: string | null;
  file_url: string | null;
  created_at: string;
};

// 조인 결과용 보조 타입
export type PpeIssuanceWithRelations = PpeIssuance & {
  employees?: Pick<Employee, "id" | "name" | "department" | "phone"> | null;
  ppe_items?: Pick<PpeItem, "id" | "item_name" | "category" | "model_name" | "certification_number"> | null;
};

// ── 비상조치 및 위기대응 모듈 ──────────────────────────────────

export type EmergencyContactType = "사내" | "원청" | "소방" | "경찰" | "병원" | "기타";

export type EmergencyContact = {
  id: string;
  admin_id: string;
  contact_type: string;
  organization_name: string;
  contact_name: string | null;
  phone: string;
  secondary_phone: string | null;
  description: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmergencyEquipmentStatus = "정상" | "점검필요" | "사용불가" | "교체예정";

export type EmergencyEquipment = {
  id: string;
  admin_id: string;
  equipment_name: string;
  category: string;
  location: string;
  quantity: number;
  status: EmergencyEquipmentStatus;
  last_inspected_at: string | null;
  next_inspection_date: string | null;
  inspector_name: string | null;
  note: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmergencyScenario = {
  id: string;
  admin_id: string;
  scenario_type: string;
  title: string;
  overview: string | null;
  initial_response: string[];
  evacuation_actions: string[];
  rescue_actions: string[];
  hazard_removal_actions: string[];
  secondary_damage_prevention: string[];
  reporting_actions: string[];
  role_assignments: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type StopWorkStatus = "작업중지" | "조치중" | "재개승인" | "종료";

export type StopWorkRecord = {
  id: string;
  admin_id: string;
  occurred_at: string;
  worksite_location: string;
  work_type: string | null;
  reporter_name: string;
  stop_reason: string;
  hazard_description: string | null;
  immediate_action: string | null;
  corrective_action: string | null;
  status: StopWorkStatus;
  restart_approved_by: string | null;
  restart_approved_at: string | null;
  restart_note: string | null;
  photo_urls: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DrillResultStatus = "작성중" | "검토중" | "완료";

export type EmergencyDrill = {
  id: string;
  admin_id: string;
  drill_date: string;
  scenario_id: string | null;
  drill_type: string;
  location: string;
  supervisor_name: string | null;
  participant_count: number;
  summary: string | null;
  issues_found: string | null;
  improvement_actions: string | null;
  result_status: DrillResultStatus;
  photo_urls: string[];
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EmergencyDrillAttendee = {
  id: string;
  drill_id: string;
  employee_id: string | null;
  employee_name: string;
  attended: boolean;
  note: string | null;
  created_at: string;
};
