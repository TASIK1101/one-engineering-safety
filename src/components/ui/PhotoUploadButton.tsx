"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "safety-photos";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

interface Props {
  /** 버킷 내 폴더 경로. 예: "inspections/items" | "corrective-actions/uuid" */
  folder: string;
  label: string;
  currentUrl?: string | null;
  onUpload: (publicUrl: string) => void;
  disabled?: boolean;
}

export default function PhotoUploadButton({
  folder,
  label,
  currentUrl,
  onUpload,
  disabled = false,
}: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  // 파일 선택 시 실행
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("이미지 파일만 업로드할 수 있습니다. (JPG, PNG, WEBP, GIF)");
      return;
    }

    // 크기 검증
    if (file.size > MAX_BYTES) {
      setError(`파일 크기는 ${MAX_MB}MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    setUploading(true);
    setProgress(10);

    // 고유 파일명 생성
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const path = `${folder}/${Date.now()}-${uniqueId}.${ext}`;

    try {
      // 로컬 미리보기 먼저 표시
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setProgress(40);

      // Supabase Storage 업로드
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      setProgress(80);

      if (uploadError) {
        setPreview(currentUrl ?? null); // 실패 시 이전 미리보기 복원
        throw new Error(uploadError.message);
      }

      // Public URL 획득
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      setPreview(publicUrl);
      onUpload(publicUrl);
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
      setError(`업로드 실패: ${msg}`);
    } finally {
      setUploading(false);
      setProgress(0);
      // input 초기화 (같은 파일 재선택 허용)
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const triggerPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{label}</p>

      {/* 미리보기 있을 때 */}
      {preview ? (
        <div className="space-y-2">
          {/* 이미지 미리보기 */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="업로드된 사진"
              className="w-full max-h-64 object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                <div className="w-2/3 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white text-xs font-medium">업로드 중...</p>
              </div>
            )}
          </div>

          {/* 사진 교체 버튼 */}
          {!uploading && (
            <button
              type="button"
              onClick={triggerPicker}
              disabled={disabled}
              className="w-full py-3 text-sm font-semibold text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>📷</span> 사진 교체
            </button>
          )}
        </div>
      ) : (
        /* 미리보기 없을 때 — 업로드 유도 버튼 */
        <button
          type="button"
          onClick={triggerPicker}
          disabled={disabled || uploading}
          className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center gap-2"
        >
          {uploading ? (
            <>
              <span className="text-3xl animate-spin">⏳</span>
              <div className="w-2/3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">업로드 중...</p>
            </>
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <p className="text-sm font-semibold text-gray-700">사진 추가</p>
              <p className="text-xs text-gray-400">탭하여 촬영하거나 갤러리에서 선택</p>
              <p className="text-xs text-gray-300 mt-0.5">최대 {MAX_MB}MB · JPG / PNG / WEBP</p>
            </>
          )}
        </button>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-red-500 text-sm shrink-0">⚠️</span>
          <p className="text-sm text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {/* 숨겨진 파일 input — 모바일에서 카메라/갤러리 선택 가능 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
