"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  permitToken: string;
  workerId: string;
  children: React.ReactNode;
}

export default function WorkPermitWorkerGuard({ permitToken, workerId, children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">("checking");

  useEffect(() => {
    const saved = sessionStorage.getItem("verifiedWorkerId");
    if (saved === workerId) {
      setStatus("ok");
    } else {
      setStatus("redirecting");
      router.replace(`/work-permits/sign/${permitToken}`);
    }
  }, [permitToken, workerId, router]);

  if (status === "checking" || status === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">본인 확인 중...</p>
      </div>
    );
  }

  return <>{children}</>;
}
