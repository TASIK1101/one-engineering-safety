"use client";

/**
 * ImageUpload — 사진 업로드 컴포넌트
 *
 * - 카메라 촬영 버튼 (capture="environment")
 * - 갤러리/파일 선택 버튼
 * - 업로드 진행 표시
 * - 업로드 완료 후 미리보기
 * - Supabase Storage public URL을 onUpload 콜백으로 전달
 */

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildPublicUrl, resolvePhotoUrl } from "@/lib/photo-url";

const BUCKET = "safety-photos";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface Props {
  /** 버킷 내 폴더. 예: "inspections/items" | "corrective-actions/{id}" */
  folder: string;
  label?: string;
  /** DB에 이미 저장된 URL (수정 시 초기값) */
  initialUrl?: string | null;
  /** 업로드 성공 후 public URL을 전달하는 콜백 */
  onUpload: (publicUrl: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  folder,
  label = "사진",
  initialUrl,
  onUpload,
  disabled = false,
}: Props) {
  const supabase = createClient();

  // 카메라 촬영용 (capture="environment")
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // 갤러리/파일 선택용
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    resolvePhotoUrl(initialUrl) ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  /* ── 업로드 핵심 로직 ─────────────────────────────────────── */
  async function uploadFile(file: File) {
    setErrorMsg("");

    // 타입 검사
    if (!file.type.startsWith("image/")) {
      setErrorMsg("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    // 크기 검사
    if (file.size > MAX_BYTES) {
      setErrorMsg(
        `파일이 너무 큽니다. ${MAX_MB}MB 이하 파일을 선택해주세요. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
      );
      return;
    }

    setUploading(true);
    setProgress(10);

    // 고유 경로 생성
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uid = crypto.randomUUID().slice(0, 8);
    const filePath = `${folder}/${Date.now()}-${uid}.${ext}`;

    // Supabase public URL 명시적 조립 (SDK 의존 없음)
    const publicUrl = buildPublicUrl(filePath);

    // 업로드 전 blob 미리보기
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setProgress(30);

    try {
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      setProgress(80);

      if (uploadErr) {
        URL.revokeObjectURL(blobUrl);
        setPreviewUrl(resolvePhotoUrl(initialUrl) ?? null);
        setErrorMsg(
          uploadErr.message.includes("Bucket")
            ? "스토리지 버킷이 설정되지 않았습니다. 관리자에게 문의하세요."
            : `업로드 실패: ${uploadErr.message}`
        );
        return;
      }

      // 성공 — blob URL → 실제 Supabase public URL 교체
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(publicUrl);
      onUpload(publicUrl);
      setProgress(100);
    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(resolvePhotoUrl(initialUrl) ?? null);
      setErrorMsg(
        err instanceof Error ? `업로드 실패: ${err.message}` : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
      setProgress(0);
      // 같은 파일 재선택 허용
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  /* ── 렌더링 ───────────────────────────────────────────────── */
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-semibold text-gray-600">{label}</p>
      )}

      {/* ── 사진 미리보기 ── */}
      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="w-full max-h-72 object-contain"
            onError={() => {
              setPreviewUrl(null);
              setErrorMsg("이미지를 불러올 수 없습니다. 다시 업로드해주세요.");
            }}
          />
          {/* 업로드 진행 오버레이 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 rounded-xl">
              <div className="w-3/4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-sm font-medium">업로드 중... {progress}%</p>
            </div>
          )}
        </div>
      )}

      {/* ── 업로드 버튼 영역 ── */}
      {!uploading && (
        <div className={`grid gap-2 ${previewUrl ? "grid-cols-2" : "grid-cols-1"}`}>
          {/* 사진 없을 때: 큰 버튼 두 개 */}
          {!previewUrl && (
            <>
              {/* 카메라 촬영 버튼 */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-bold text-blue-700">카메라 촬영</span>
                <span className="text-xs text-blue-400">바로 촬영하기</span>
              </button>

              {/* 갤러리/파일 선택 버튼 */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-6 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-bold text-gray-700">갤러리 선택</span>
                <span className="text-xs text-gray-400">사진 보관함에서 선택</span>
              </button>
            </>
          )}

          {/* 사진 있을 때: 교체 버튼 두 개 */}
          {previewUrl && (
            <>
              <button
                type="button"
                disabled={disabled}
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold text-blue-700"
              >
                <span>📷</span> 재촬영
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold text-gray-700"
              >
                <span>🖼️</span> 다른 사진
              </button>
            </>
          )}
        </div>
      )}

      {/* 업로드 중 전체 진행바 */}
      {uploading && !previewUrl && (
        <div className="py-6 bg-blue-50 border-2 border-blue-200 rounded-xl flex flex-col items-center gap-3">
          <div className="w-3/4 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 font-medium">업로드 중... {progress}%</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 shrink-0">⚠️</span>
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* 새 탭에서 보기 링크 (업로드 완료 후) */}
      {previewUrl && !uploading && previewUrl.startsWith("http") && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-blue-500 hover:text-blue-700 hover:underline text-center"
        >
          새 탭에서 사진 보기 ↗
        </a>
      )}

      {/* 숨겨진 파일 inputs */}
      {/* 카메라 촬영 전용 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />
      {/* 갤러리/파일 선택 전용 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
