import { getTbmStatusColor } from "@/lib/tbm-work-types";

export default function TBMStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${getTbmStatusColor(status)}`}
    >
      {status}
    </span>
  );
}
