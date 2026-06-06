import { NextResponse } from "next/server";

// ⚠️ 폐기된 엔드포인트
// 작업허가서 역할별 승인은 반드시 역할별 approval_token 공개 링크
// (/work-permits/approve/[approvalToken])를 통해서만 처리한다.
// 로그인된 관리자가 타인의 서명을 대신 입력하는 우회 경로를 차단하기 위해
// 이 엔드포인트는 항상 410 Gone을 반환한다.
export async function POST() {
  return NextResponse.json(
    {
      error: "gone",
      message:
        "이 기능은 폐기되었습니다. 역할별 전자승인 링크를 통해 각 담당자가 직접 서명해야 합니다.",
    },
    { status: 410 }
  );
}
