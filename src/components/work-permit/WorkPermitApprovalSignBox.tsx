"use client";

// 이 컴포넌트는 WorkPermitApprovalLinkBox로 대체됨
// 레거시 참조가 있을 수 있어 파일 유지
import type { WorkPermitApproval } from "@/types";

interface Props {
  permitId: string;
  permitStatus: string;
  approvals: WorkPermitApproval[];
}

export default function WorkPermitApprovalSignBox(_props: Props) {
  return null;
}
