export const TRAINING_TYPE_LABELS = {
  regular_training: "정기 안전교육",
  pre_work_training: "작업 전 안전교육",
  new_employee_training: "신규자 교육",
  special_training: "특별교육",
  safety_notice: "안전공지 확인",
} as const;

export type TrainingType = keyof typeof TRAINING_TYPE_LABELS;

export const TRAINING_TYPE_COLORS: Record<TrainingType, string> = {
  regular_training: "bg-blue-50 text-blue-700 border-blue-100",
  pre_work_training: "bg-green-50 text-green-700 border-green-100",
  new_employee_training: "bg-purple-50 text-purple-700 border-purple-100",
  special_training: "bg-orange-50 text-orange-700 border-orange-100",
  safety_notice: "bg-gray-100 text-gray-600 border-gray-200",
};

export const TRAINING_TYPE_OPTIONS = Object.entries(TRAINING_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as TrainingType, label })
);

export function getTypeLabel(type: string): string {
  return TRAINING_TYPE_LABELS[type as TrainingType] ?? type;
}

export function getTypeColor(type: string): string {
  return (
    TRAINING_TYPE_COLORS[type as TrainingType] ??
    "bg-gray-100 text-gray-600 border-gray-200"
  );
}
