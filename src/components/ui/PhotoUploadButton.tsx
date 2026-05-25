"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildPublicUrl, resolvePhotoUrl } from "@/lib/photo-url";

const BUCKET = "safety-photos";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

interface Props {
  /** 버킷 내 폴더 경로. 예: "inspections/items" | "corrective-actions/{id}" */
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

  // currentUrl 이 path 형태여도 올바른 URL로 변환해서 초기 미리보기 표시
  const [preview, setPreview] = useState<string | null>(
    resolvePhotoUrl(currentUrl) ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("이미지 파일만 업로드할 수 있습니다. (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(
        `파일 크기는 ${MAX_MB}MB 이하여야 합니다. (현재: ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB)`
      );
      return;
    }

    setUploading(true);
    setProgress(10);

    // 고유 파일명: folder/타임스탬프-uuid.ext
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uid = crypto.randomUUID().slice(0, 8);
    const filePath = `${folder}/${Date.now()}-${uid}.${ext}`;

    // ── 명시적 public URL 조립 (SDK getPublicUrl 미사용) ──────────
    // SDK가 환경에 따라 잘못된 URL을 반환하는 문제를 방지한다.
    const publicUrl = buildPublicUrl(filePath);
    console.log("[PhotoUpload] 업로드 경로:", filePath);
    console.log("[PhotoUpload] 저장될 public URL:", publicUrl);

    // 업로드 전 로컬 blob 미리보기
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setProgress(30);

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      setProgress(80);

      if (uploadError) {
        console.error("[PhotoUpload] 업로드 실패:", uploadError);
        URL.revokeObjectURL(blobUrl);
        setPreview(resolvePhotoUrl(currentUrl) ?? null);
        setError(`업로드 실패: ${uploadError.message}`);
        return;
      }

      // 업로드 성공 → blob URL을 실제 Supabase public URL로 교체
      URL.revokeObjectURL(blobUrl);
      setPreview(publicUrl);
      onUpload(publicUrl); // ← 반드시 https:// 로 시작하는 전체 URL 전달
      setProgress(100);
      console.log("[PhotoUpload] 업로드 성공, 저장 URL:", publicUrl);
    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      setPreview(resolvePhotoUrl(currentUrl) ?? null);
      const msg =
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
      console.error("[PhotoUpload] 예외:", msg);
      setError(`업로드 실패: ${msg}`);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const triggerPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{label}</p>

      {preview ? (
        <div className="space-y-2">
          {/* 사진 미리보기 */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="업로드된 사진"
              className="w-full max-h-64 object-contain"
              onError={() => {
                // 이미지 로드 실패 시 미리보기 초기화 (깨진 아이콘 방지)
                console.warn("[PhotoUpload] 이미지 로드 실패:", preview);
                setPreview(null);
                setError("이미지를 불러올 수 없습니다. 다시 업로드해주세요.");
              }}
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
        <button
          type="button"
          onClick={triggerPicker}
          disabled={disabled || uploading}
          className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-2/3 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">업로드 중...</p>
            </>
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <p className="text-sm font-semibold text-gray-700">사진 추가</p>
              <p className="text-xs text-gray-400">탭하여 촬영하거나 갤러리에서 선택</p>
              <p className="text-xs text-gray-300 mt-0.5">
                최대 {MAX_MB}MB · JPG / PNG / WEBP
              </p>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-red-500 text-sm shrink-0 mt-0.5">⚠️</span>
          <p className="text-sm text-red-700 leading-snug">{error}</p>
        </div>
      )}

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
