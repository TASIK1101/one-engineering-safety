"use client";

import { useState } from "react";
import { resolvePhotoUrl } from "@/lib/photo-url";

interface Props {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** 이미지가 없거나 로드 실패 시 표시할 UI (기본: "사진 없음" 박스) */
  fallback?: React.ReactNode;
}

/**
 * 사진 URL을 안전하게 렌더링하는 컴포넌트.
 * - DB에 path만 저장된 경우 Supabase public URL로 자동 변환
 * - 이미지 로드 실패 시 깨진 아이콘 대신 fallback UI 표시
 * - 새 탭에서 열기 링크도 올바른 전체 URL로 제공
 */
export default function SafeImg({ src, alt, className, fallback }: Props) {
  const [failed, setFailed] = useState(false);

  const resolvedUrl = resolvePhotoUrl(src);

  const defaultFallback = (
    <div className="h-32 w-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-400">사진 없음</p>
    </div>
  );

  if (!resolvedUrl || failed) {
    return <>{fallback ?? defaultFallback}</>;
  }

  return (
    <div className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedUrl}
        alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-blue-500 hover:text-blue-700 hover:underline"
      >
        새 탭에서 보기 ↗
      </a>
    </div>
  );
}
