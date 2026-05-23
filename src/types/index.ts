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
