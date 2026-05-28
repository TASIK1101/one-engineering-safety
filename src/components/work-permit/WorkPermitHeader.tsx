import Link from "next/link";
import type { WorkPermit } from "@/types";
import {
  WorkPermitStatusBadge,
  WorkPermitGradeBadge,
} from "@/components/work-permit/WorkPermitStatusBadge";

export default function WorkPermitHeader({
  permit,
  permitId,
}: {
  permit: WorkPermit;
  permitId: string;
}) {
  return (
    <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
      <div className="min-w-0 flex-1">
        <div className="mb-2">
          <Link
            href="/work-permits"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← 작업허가서 목록
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <WorkPermitGradeBadge grade={permit.grade} />
          <WorkPermitStatusBadge status={permit.status} />
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
            {permit.permit_type}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {permit.work_name || permit.title}
        </h1>
      </div>
      <Link
        href={`/records/work-permit/${permitId}`}
        target="_blank"
        className="shrink-0 ml-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
      >
        🖨️ 출력
      </Link>
    </div>
  );
}
