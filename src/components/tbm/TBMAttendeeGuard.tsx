"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  signToken: string;
  attendeeId: string;
  children: React.ReactNode;
}

/**
 * /tbm/sign/[signToken]/[attendeeId] 직접 URL 접근 차단 가드.
 * TBMPhoneVerifyForm이 sessionStorage에 저장한 verifiedAttendeeId와
 * 현재 attendeeId가 일치하지 않으면 본인확인 페이지로 되돌린다.
 */
export default function TBMAttendeeGuard({
  signToken,
  attendeeId,
  children,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">(
    "checking"
  );

  useEffect(() => {
    const saved = sessionStorage.getItem("verifiedAttendeeId");
    if (saved === attendeeId) {
      setStatus("ok");
    } else {
      setStatus("redirecting");
      router.replace(`/tbm/sign/${signToken}`);
    }
  }, [signToken, attendeeId, router]);

  if (status === "ok") {
    return <>{children}</>;
  }

  // checking / redirecting → 빈 화면 (순간 flash 방지)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">본인 확인 중...</p>
    </div>
  );
}
