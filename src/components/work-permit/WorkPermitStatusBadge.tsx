import { STATUS_COLORS, GRADE_COLORS } from "@/lib/work-permit-types";

export function WorkPermitStatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

export function WorkPermitGradeBadge({ grade }: { grade: string }) {
  const cls = GRADE_COLORS[grade] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex text-xs font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {grade}급
    </span>
  );
}
