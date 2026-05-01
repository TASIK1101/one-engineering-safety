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
